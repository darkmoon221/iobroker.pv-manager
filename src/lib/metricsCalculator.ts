import {PvManager} from '../main';
import {SensorData, STATES, TotalValues} from './model';
import {StateUtils} from './stateUtils';

export class MetricsCalculator {

    private readonly adapter: PvManager;

    private readonly kWh = 'kWh';
    private readonly watt = 'W';
    private readonly percentage = '%';

    private inverterTotal = '';
    private inverterCurrent = '';

    private meterData = '';

    constructor(pvManager: PvManager) {
        this.adapter = pvManager;
    }

    updateInverterTotal(total?: string): void {
        if (total) {
            this.inverterTotal = total;
            this.adapter.log.debug('Update inverter total feed: ' + this.inverterTotal);
        }
    }

    updateEnergyMeterData(meterData?: string): void {
        if (meterData) {
            this.adapter.log.debug('Update energy meter data: ' + this.meterData);

            this.meterData = meterData;
            this.calculateMetrics();
            this.calculateLiveValues();
        }
    }

    updateInverterCurrent(current: string | undefined): void {
        if (current) {
            this.inverterCurrent = current;
        }
    }

    getSensorData(): SensorData {
        return JSON.parse(this.meterData,
            (_, val) => {
                if (Array.isArray(val) || typeof val !== 'object') {
                    return val;
                }
                return Object.entries(val).reduce((a, [key, val]) => {
                    (a as any)[key.toLowerCase()] = val;
                    return a;
                }, {});
            });
    }

    isCorrectionValueAvailable(): boolean {
        return !!this.adapter.config.wechselrichterTotalKorrekturWert
            && this.adapter.config.wechselrichterTotalKorrekturWert > 0;
    }

    calculateMetrics(): void {

        if (this.inverterTotal) {

            const sensorData: SensorData = this.getSensorData();

            this.adapter.log.debug('Inverter correction value in kWh: ' + this.adapter.config.wechselrichterTotalKorrekturWert);


            const inverterKWH = (parseFloat(this.inverterTotal)) / 1000;

            if (this.isCorrectionValueAvailable()) {
                StateUtils.setStateWithAck(this.adapter, STATES.total.prefix + STATES.total.wechselrichterCorrected, inverterKWH - this.adapter.config.wechselrichterTotalKorrekturWert).then();
            }

            StateUtils.setStateWithAck(this.adapter, STATES.total.prefix + STATES.total.wechselrichter, inverterKWH).then();

            const consumptionHousehold = sensorData.strom.bezug;
            StateUtils.setStateWithAck(this.adapter, STATES.total.prefix + STATES.total.bezugHaushalt, consumptionHousehold).then();

            const feedHousehold = sensorData.strom.einspeisung;
            StateUtils.setStateWithAck(this.adapter, STATES.total.prefix + STATES.total.einspeisungHaushalt, feedHousehold).then();

            const consumptionHeatPump = sensorData.heizung['1.8.0'];
            StateUtils.setStateWithAck(this.adapter, STATES.total.prefix + STATES.total.bezugWp, consumptionHeatPump).then();

            const feedHeatPump = sensorData.heizung['2.8.0'];
            StateUtils.setStateWithAck(this.adapter, STATES.total.prefix + STATES.total.einspeisungWp, feedHeatPump).then();

            const ownConsumptionHousehold = inverterKWH - feedHousehold;
            StateUtils.setStateWithAck(this.adapter, STATES.total.prefix + STATES.total.eigenbedarfHaushalt, ownConsumptionHousehold).then();

            const ownConsumptionHeatPump = inverterKWH - feedHeatPump - ownConsumptionHousehold;
            StateUtils.setStateWithAck(this.adapter, STATES.total.prefix + STATES.total.eigenbedarfWp, ownConsumptionHeatPump).then();

            const gridConsumptionHeatPump = this.adapter.config.wpEnergyMeterTotalConsumptionBeforeChange + consumptionHeatPump - consumptionHousehold;
            StateUtils.setStateWithAck(this.adapter, STATES.total.prefix + STATES.total.bezugNetz, gridConsumptionHeatPump).then();

            const totalConsumptionHousehold = consumptionHousehold + ownConsumptionHousehold;
            StateUtils.setStateWithAck(this.adapter, STATES.total.prefix + STATES.total.gesamtVerbrauchHaushalt, totalConsumptionHousehold).then();

            const totalConsumptionHeatPumpShare = gridConsumptionHeatPump + ownConsumptionHeatPump;
            StateUtils.setStateWithAck(this.adapter, STATES.total.prefix + STATES.total.gesamtVerbrauchWp, totalConsumptionHeatPumpShare).then();

            const totalConsumptionHouseholdShare = ownConsumptionHousehold * 100 / inverterKWH;
            StateUtils.setStateWithAck(this.adapter, STATES.total.prefix + STATES.total.anteilEigenbedarfHaushalt, totalConsumptionHouseholdShare).then();

            const ownConsumptionHeatPumpShare = ownConsumptionHeatPump * 100 / inverterKWH;
            StateUtils.setStateWithAck(this.adapter, STATES.total.prefix + STATES.total.anteilEigenbedarfWp, ownConsumptionHeatPumpShare).then();

            const ownConsumptionTotalShare = (ownConsumptionHeatPump + ownConsumptionHousehold) * 100 / inverterKWH;
            StateUtils.setStateWithAck(this.adapter, STATES.total.prefix + STATES.total.gesamtEigenverbrauch, ownConsumptionTotalShare).then();

            const cumulated: TotalValues = {
                time: new Date().toISOString(),
                wechselrichter: inverterKWH,
                bezugHaushalt: consumptionHousehold,
                einspeisungHaushalt: feedHousehold,
                bezugWp: consumptionHeatPump,
                einspeisungWp: feedHeatPump,
                eigenbedarfHaushalt: ownConsumptionHousehold,
                eigenbedarfWp: ownConsumptionHeatPump,
                bezugNetz: gridConsumptionHeatPump,
                gesamtVerbrauchHaushalt: totalConsumptionHousehold,
                gesamtVerbrauchWp: totalConsumptionHeatPumpShare,
                anteilEigenbedarfHaushalt: totalConsumptionHouseholdShare,
                anteilEigenbedarfWp: ownConsumptionHeatPumpShare,
                gesamtEigenverbrauch: ownConsumptionTotalShare
            };

            StateUtils.setStateWithAck(this.adapter, 'cumulated', JSON.stringify(cumulated)).then();

        }
    }

    calculateLiveValues(): void {
        if (this.inverterCurrent) {
            const sensorData = this.getSensorData();
            const inverterCurrent = parseFloat(this.inverterCurrent);

            const household = sensorData.strom.aktleist;
            const heatPump = sensorData.heizung.aktleist;

            const inverterFeed = inverterCurrent < 0 ? 0 : inverterCurrent;
            let consumption = 0;
            let feed = 0;

            const consumptionHouseholdRawSensorValue = household;
            const consumptionHeatPumpRawSensorValue = heatPump;

            let consumptionHousehold = 0;
            let consumptionHeatPump = 0;

            if (inverterCurrent < 0) {
                if (household < 0 || heatPump < 0) {
                    this.adapter.log.warn('inverter < 0, household < 0 || heatpump < 0 should not happen');
                    return;
                } else {
                    consumption = heatPump;
                    consumptionHousehold = household;
                    consumptionHeatPump = heatPump - household;
                }
            } else {
                if (household < 0) {
                    if (heatPump < 0) {
                        feed = Math.abs(heatPump);
                        consumptionHousehold = inverterCurrent - Math.abs(household);
                        consumptionHeatPump = Math.abs(household) - Math.abs(heatPump);
                    } else {
                        consumption = heatPump;
                        consumptionHousehold = inverterCurrent - Math.abs(household);
                        consumptionHeatPump = Math.abs(household) + heatPump;
                    }
                } else {
                    if (heatPump < 0) {
                        this.adapter.log.warn('inverter > 0, household > 0 || heatpump < 0 should not happen');
                        return;
                    } else {
                        consumption = heatPump;
                        consumptionHousehold = inverterCurrent + household;
                        consumptionHeatPump = heatPump - household;
                    }
                }
            }

            StateUtils.setStateWithAck(this.adapter, STATES.current.prefix + STATES.current.wechselrichterEinspeisung, inverterFeed).then();
            StateUtils.setStateWithAck(this.adapter, STATES.current.prefix + STATES.current.verbrauchHaushalt, Math.max(consumptionHousehold, 0)).then();
            StateUtils.setStateWithAck(this.adapter, STATES.current.prefix + STATES.current.verbrauchWp, Math.max(consumptionHeatPump, 0)).then();
            StateUtils.setStateWithAck(this.adapter, STATES.current.prefix + STATES.current.bezugNetz, consumption).then();
            StateUtils.setStateWithAck(this.adapter, STATES.current.prefix + STATES.current.einspeisungUeberschuss, feed).then();
            StateUtils.setStateWithAck(this.adapter, STATES.current.prefix + STATES.current.haushaltBezugRaw, consumptionHouseholdRawSensorValue).then();
            StateUtils.setStateWithAck(this.adapter, STATES.current.prefix + STATES.current.wpBezugRaw, consumptionHeatPumpRawSensorValue).then();
        }
    }


    async initializeStates(): Promise<any> {
        await StateUtils.createObject(this.adapter, STATES.total.prefix, STATES.total.wechselrichterCorrected, this.kWh);
        await StateUtils.createObject(this.adapter, STATES.total.prefix, STATES.total.wechselrichter, this.kWh);
        await StateUtils.createObject(this.adapter, STATES.total.prefix, STATES.total.bezugHaushalt, this.kWh);
        await StateUtils.createObject(this.adapter, STATES.total.prefix, STATES.total.einspeisungHaushalt, this.kWh);
        await StateUtils.createObject(this.adapter, STATES.total.prefix, STATES.total.bezugWp, this.kWh);
        await StateUtils.createObject(this.adapter, STATES.total.prefix, STATES.total.einspeisungWp, this.kWh);
        await StateUtils.createObject(this.adapter, STATES.total.prefix, STATES.total.eigenbedarfHaushalt, this.kWh);
        await StateUtils.createObject(this.adapter, STATES.total.prefix, STATES.total.eigenbedarfWp, this.kWh);
        await StateUtils.createObject(this.adapter, STATES.total.prefix, STATES.total.bezugNetz, this.kWh);
        await StateUtils.createObject(this.adapter, STATES.total.prefix, STATES.total.gesamtVerbrauchHaushalt, this.kWh);
        await StateUtils.createObject(this.adapter, STATES.total.prefix, STATES.total.gesamtVerbrauchWp, this.kWh);
        await StateUtils.createObject(this.adapter, STATES.total.prefix, STATES.total.anteilEigenbedarfHaushalt, this.percentage);
        await StateUtils.createObject(this.adapter, STATES.total.prefix, STATES.total.anteilEigenbedarfWp, this.percentage);
        await StateUtils.createObject(this.adapter, STATES.total.prefix, STATES.total.gesamtEigenverbrauch, this.percentage);


        await StateUtils.createObject(this.adapter, STATES.current.prefix, STATES.current.wechselrichterEinspeisung, this.watt);
        await StateUtils.createObject(this.adapter, STATES.current.prefix, STATES.current.verbrauchHaushalt, this.watt);
        await StateUtils.createObject(this.adapter, STATES.current.prefix, STATES.current.verbrauchWp, this.watt);
        await StateUtils.createObject(this.adapter, STATES.current.prefix, STATES.current.einspeisungUeberschuss, this.watt);
        await StateUtils.createObject(this.adapter, STATES.current.prefix, STATES.current.bezugNetz, this.watt);
        await StateUtils.createObject(this.adapter, STATES.current.prefix, STATES.current.haushaltBezugRaw, this.watt);
        await StateUtils.createObject(this.adapter, STATES.current.prefix, STATES.current.wpBezugRaw, this.watt);

        await this.adapter.setObjectNotExistsAsync('cumulated', {
            type: 'state',
            common: {
                name: 'cumulated',
                type: 'object',
                role: 'variable',
                read: true,
                write: true
            },
            native: {},
        });
    }

}
