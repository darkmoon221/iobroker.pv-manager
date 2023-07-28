import {assert} from 'chai';
import {MetricsCalculator} from '../src/lib/metricsCalculator';


const path = require('path');
const {tests, utils} = require('@iobroker/testing');

interface States {
    inverter: number,
    consumptionHousehold: number,
    consumptionHeatPump: number,
    consumptionGrid: number,
    gridFeed: number,
    consumptionHouseholdRaw: number,
    consumptionHeatPumpRaw: number
}

// Run unit tests - See https://github.com/ioBroker/testing for a detailed explanation and further options
tests.unit(path.join(__dirname, '..'), {
    //     ~~~~~~~~~~~~~~~~~~~~~~~~~
    // This should be the adapter's root directory

    // Define your own tests inside defineAdditionalTests
    defineAdditionalTests() {
        // Create mocks and asserts
        const {adapter, database} = utils.unit.createMocks({});
        const {assertObjectExists} = utils.unit.createAsserts(database, adapter);

        const id = 'test.0.';

        const calculator = new MetricsCalculator(adapter);

        function setValues(inverterCurrent: string, inverterTotal: string, sensorData: any) {
            calculator.updateInverterCurrent(inverterCurrent);
            calculator.updateInverterTotal(inverterTotal);
            calculator.updateEnergyMeterData(JSON.stringify(sensorData));
        }

        function getStates(): States {
            const inverter = database.getState(id + 'current.' + 'wechselrichterEinspeisung').val;
            const consumptionHousehold = database.getState(id + 'current.' + 'verbrauchHaushalt').val;
            const consumptionHeatPump = database.getState(id + 'current.' + 'verbrauchWp').val;
            const consumptionGrid = database.getState(id + 'current.' + 'bezugNetz').val;
            const gridFeed = database.getState(id + 'current.' + 'einspeisungUeberschuss').val;
            const consumptionHouseholdRaw = database.getState(id + 'current.' + 'haushaltBezugRaw').val;
            const consumptionHeatPumpRaw = database.getState(id + 'current.' + 'wpBezugRaw').val;

            return {inverter, consumptionHousehold, consumptionHeatPump, consumptionGrid, gridFeed, consumptionHouseholdRaw, consumptionHeatPumpRaw};
        }

        function assertStates(expected: States) {
            const states = getStates();
            assert.equal(states.inverter, expected.inverter);
            assert.equal(states.consumptionHousehold, expected.consumptionHousehold);
            assert.equal(states.consumptionHeatPump, expected.consumptionHeatPump);
            assert.equal(states.consumptionGrid, expected.consumptionGrid);
            assert.equal(states.gridFeed, expected.gridFeed);
            assert.equal(states.consumptionHouseholdRaw, expected.consumptionHouseholdRaw);
            assert.equal(states.consumptionHeatPumpRaw, expected.consumptionHeatPumpRaw);
        }

        describe('my test', () => {
            afterEach(() => {
                // The mocks keep track of all method invocations - reset them after each single test
                adapter.resetMockHistory();
                // We want to start each test with a fresh database
                database.clear();
            });


            /**
             * Inverter: 1000
             * Household consumption: -500 -> 500 taken from inverter, 500 excess
             * HeatPump consumption: -250 -> 250 taken from household, 250 excess
             * Result: Grid feed: 250
             */
            it('pv_with_grid_feed', () => {
                const inverterCurrent = '1000';
                const inverterTotal = '9247745';

                const sensorData = {
                    'Time': '2023-07-24T11:05:20',
                    'Strom': {
                        'Bezug': 11850.78,
                        'Einspeisung': 7055.87,
                        'AktLeist': -500
                    },
                    'Heizung': {
                        '1.8.0': 7873.42,
                        '2.8.0': 6212.31,
                        'AktLeist': -250
                    }
                };

                setValues(inverterCurrent, inverterTotal, sensorData);
                calculator.calculateLiveValues();

                const expected: States = {
                    inverter: 1000,
                    consumptionHousehold: 500,
                    consumptionHeatPump: 250,
                    consumptionGrid: 0,
                    gridFeed: 250,
                    consumptionHouseholdRaw: -500,
                    consumptionHeatPumpRaw: -250
                };

                assertStates(expected);
            });

            /**
             * Inverter: 1000
             * Household consumption: 500: 1000 taken from inverter and 500 taken from grid (through heat pump)
             * HeatPump consumption: 750: 500 for household, 250 for heat pump
             * Result: Grid consumption: 750
             */
            it('pv_with_grid_consumption_household', () => {
                const inverterCurrent = '1000';
                const inverterTotal = '9247745';

                const sensorData = {
                    'Time': '2023-07-24T11:05:20',
                    'Strom': {
                        'Bezug': 11850.78,
                        'Einspeisung': 7055.87,
                        'AktLeist': 500
                    },
                    'Heizung': {
                        '1.8.0': 7873.42,
                        '2.8.0': 6212.31,
                        'AktLeist': 750
                    }
                };
                setValues(inverterCurrent, inverterTotal, sensorData);

                calculator.calculateLiveValues();

                const expected: States = {
                    inverter: 1000,
                    consumptionHousehold: 1500,
                    consumptionHeatPump: 250,
                    consumptionGrid: 750,
                    gridFeed: 0,
                    consumptionHouseholdRaw: 500,
                    consumptionHeatPumpRaw: 750
                };

                assertStates(expected);

            });

            /**
             * Inverter: 3000
             * Household consumption: -2700: 300 taken from inverter, 2700 excess
             * HeatPump consumption: -2600: 100 taken from household, 2600 excess
             * Result: Grid feed: 2600
             */
            it('pv_with_grid_feed_2', () => {

                const inverterCurrent = '3000';
                const inverterTotal = '9247745';

                const sensorData = {
                    'Time': '2023-07-24T11:05:20',
                    'Strom': {
                        'Bezug': 11850.78,
                        'Einspeisung': 7055.87,
                        'AktLeist': -2700 // 300 W
                    },
                    'Heizung': {
                        '1.8.0': 7873.42,
                        '2.8.0': 6212.31,
                        'AktLeist': -2600 // 100 W
                    }
                };


                setValues(inverterCurrent, inverterTotal, sensorData);
                calculator.calculateLiveValues();

                const expected: States = {
                    inverter: 3000,
                    consumptionHousehold: 300,
                    consumptionHeatPump: 100,
                    consumptionGrid: 0,
                    gridFeed: 2600,
                    consumptionHouseholdRaw: -2700,
                    consumptionHeatPumpRaw: -2600
                };

                assertStates(expected);

            });

            /**
             * Inverter: 0
             * Household consumption: 300 taken from grid
             * HeatPump consumption: 400: 300 for household, 100 for heat pump
             * Result: Grid consumption: 400
             */
            it('pv_with_no_production', () => {

                const inverterCurrent = '0';
                const inverterTotal = '9247745';

                const sensorData = {
                    'Time': '2023-07-24T11:05:20',
                    'Strom': {
                        'Bezug': 11850.78,
                        'Einspeisung': 7055.87,
                        'AktLeist': 300
                    },
                    'Heizung': {
                        '1.8.0': 7873.42,
                        '2.8.0': 6212.31,
                        'AktLeist': 400
                    }
                };


                setValues(inverterCurrent, inverterTotal, sensorData);
                calculator.calculateLiveValues();

                const expected: States = {
                    inverter: 0,
                    consumptionHousehold: 300,
                    consumptionHeatPump: 100,
                    consumptionGrid: 400,
                    gridFeed: 0,
                    consumptionHouseholdRaw: 300,
                    consumptionHeatPumpRaw: 400
                };

                assertStates(expected);

            });

        });
    },
});
