import {PvManager} from '../main';
import {SensorData, STATES, TotalValues} from './model';
import {StateUtils} from './stateUtils';

export class MetricsCalculator {

    private readonly adapter: PvManager;

    private wechselRichterTotal = '';
    private wechselRichterCurrent = '';

    private meterData = '';

    constructor(pvManager: PvManager) {
        this.adapter = pvManager;
    }

    updateWechselrichterTotal(total: string | undefined): void {
        if (total) {
            this.wechselRichterTotal = total;
            this.adapter.log.debug('Update WechselrichterTotal: ' + this.wechselRichterTotal);
        }
    }

    updateEnergyMeterData(meterData: string | undefined): void {
        if (meterData) {
            this.adapter.log.debug('Update EnergyMeterData: ' + this.meterData);

            this.meterData = meterData;
            this.calculateMetrics();
            // this.calculateLiveConsumption();
            this.calcLive();
        }
    }

    updateWechselrichterCurrent(current: string | undefined): void {
        if (current) {
            this.wechselRichterCurrent = current;
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

    calculateMetrics(): void {

        if (this.wechselRichterTotal) {

            const sensorData: SensorData = this.getSensorData();
            // this.adapter.log.debug('Sensordata: ' + JSON.stringify(sensorData));

            //const wrKorrekturWert = this.adapter.config.wechselrichterTotalKorrekturWert | 0;
            this.adapter.log.debug('Wechselrichter Korrekturwert in kWh: ' + this.adapter.config.wechselrichterTotalKorrekturWert);


            const wrKWH = (parseFloat(this.wechselRichterTotal)) / 1000;
            //  const wrKWHPlain = (parseFloat(this.wechselRichterTotal)) / 1000;
            // this.adapter.log.debug('Values: ' + wrKorrekturWert + ', ' + wrKWHPlain );
            // this.adapter.log.debug('Wechselrichter in kWh: ' + wrKWH);
            if (this.adapter.config.wechselrichterTotalKorrekturWert && this.adapter.config.wechselrichterTotalKorrekturWert > 0) {
                StateUtils.setStateWithAck(this.adapter,STATES.total.prefix + STATES.total.wechselrichterCorrected, wrKWH - this.adapter.config.wechselrichterTotalKorrekturWert);
            }
            StateUtils.setStateWithAck(this.adapter,STATES.total.prefix + STATES.total.wechselrichter, wrKWH);

            const bezugHaushalt = sensorData.strom.bezug;
            // this.adapter.log.debug('Bezug Haushalt in kWh: ' + bezugHaushalt);
            StateUtils.setStateWithAck(this.adapter,STATES.total.prefix + STATES.total.bezugHaushalt, bezugHaushalt);


            const einspeisungHaushalt = sensorData.strom.einspeisung;
            // this.adapter.log.debug('Einspeisung Haushalt in kWh: ' + einspeisungHaushalt);
            StateUtils.setStateWithAck(this.adapter,STATES.total.prefix + STATES.total.einspeisungHaushalt, einspeisungHaushalt);


            const wpBezug = sensorData.heizung['1.8.0'];
            // this.adapter.log.debug('Bezug WP in kWh: ' + wpBezug);
            StateUtils.setStateWithAck(this.adapter,STATES.total.prefix + STATES.total.bezugWp, wpBezug);


            const wpEinspeisung = sensorData.heizung['2.8.0'];
            // this.adapter.log.debug('Einspeisung WP in kWh: ' + wpEinspeisung);
            StateUtils.setStateWithAck(this.adapter,STATES.total.prefix + STATES.total.einspeisungWp, wpEinspeisung);


            const eigenbedarfHaushalt = wrKWH - einspeisungHaushalt;
            // this.adapter.log.debug('Eigenbedarf Haushalt: ' + eigenbedarfHaushalt);
            StateUtils.setStateWithAck(this.adapter,STATES.total.prefix + STATES.total.eigenbedarfHaushalt, eigenbedarfHaushalt);


            const eigenbedarfWp = wrKWH - wpEinspeisung - eigenbedarfHaushalt;
            // this.adapter.log.debug('Eigenbedarf WP: ' + eigenbedarfWp);
            StateUtils.setStateWithAck(this.adapter,STATES.total.prefix + STATES.total.eigenbedarfWp, eigenbedarfWp);


            const bezugNetzWp = this.adapter.config.wpEnergyMeterTotalConsumptionBeforeChange + wpBezug - bezugHaushalt;
            // this.adapter.log.debug('Bezug Netz WP: ' + bezugNetzWp);
            StateUtils.setStateWithAck(this.adapter,STATES.total.prefix + STATES.total.bezugNetz, bezugNetzWp);


            const gesamtVerbrauchHaushalt = bezugHaushalt + eigenbedarfHaushalt;
            // this.adapter.log.debug('Gesamtverbrauch Haushalt: ' + gesamtVerbrauchHaushalt);
            StateUtils.setStateWithAck(this.adapter,STATES.total.prefix + STATES.total.gesamtVerbrauchHaushalt, gesamtVerbrauchHaushalt);


            const gesamtVerbrauchWP = bezugNetzWp + eigenbedarfWp;
            // this.adapter.log.debug('Gesamtverbrauch WP: ' + gesamtVerbrauchWP);
            StateUtils.setStateWithAck(this.adapter,STATES.total.prefix + STATES.total.gesamtVerbrauchWp, gesamtVerbrauchWP);


            const eigenbedarfHaushaltAnteil = eigenbedarfHaushalt * 100 / wrKWH;
            // this.adapter.log.debug('Eigenbedarf Haushalt %: ' + eigenbedarfHaushaltAnteil);
            StateUtils.setStateWithAck(this.adapter,STATES.total.prefix + STATES.total.anteilEigenbedarfHaushalt, eigenbedarfHaushaltAnteil);


            const eigenbedarfWpAnteil = eigenbedarfWp * 100 / wrKWH;
            // this.adapter.log.debug('Eigenbedarf WP %: ' + eigenbedarfWpAnteil);
            StateUtils.setStateWithAck(this.adapter,STATES.total.prefix + STATES.total.anteilEigenbedarfWp, eigenbedarfWpAnteil);


            const eigenbedarfGesamtAnteil = (eigenbedarfWp + eigenbedarfHaushalt) * 100 / wrKWH;
            // this.adapter.log.debug('Eigenbedarf gesamt %: ' + eigenbedarfGesamtAnteil);
            StateUtils.setStateWithAck(this.adapter,STATES.total.prefix + STATES.total.gesamtEigenverbrauch, eigenbedarfGesamtAnteil);


            const cumulated: TotalValues = {
                time: new Date().toISOString(),
                wechselrichter: wrKWH,
                bezugHaushalt: bezugHaushalt,
                einspeisungHaushalt: einspeisungHaushalt,
                bezugWp: wpBezug,
                einspeisungWp: wpEinspeisung,
                eigenbedarfHaushalt: eigenbedarfHaushalt,
                eigenbedarfWp: eigenbedarfWp,
                bezugNetz: bezugNetzWp,
                gesamtVerbrauchHaushalt: gesamtVerbrauchHaushalt,
                gesamtVerbrauchWp: gesamtVerbrauchWP,
                anteilEigenbedarfHaushalt: eigenbedarfHaushaltAnteil,
                anteilEigenbedarfWp: eigenbedarfWpAnteil,
                gesamtEigenverbrauch: eigenbedarfGesamtAnteil
            };

            StateUtils.setStateWithAck(this.adapter, 'cumulated', JSON.stringify(cumulated));

        }
    }

    calcLive(): void {
        if (this.wechselRichterCurrent) {
            const sensorData = this.getSensorData();
            const wrCurrent = parseFloat(this.wechselRichterCurrent);

            const haushalt = sensorData.strom.aktleist;
            const wp = sensorData.heizung.aktleist;

            const wechselrichterEinspeisung = wrCurrent < 0 ? 0 : wrCurrent;
            let einspeisung = 0;
            let bezug = 0;

            const haushaltbezugRaw = haushalt;
            const wpBezugRaw = wp;

            let haushaltBezug = 0;
            let wpBezug = 0;

            if (wrCurrent < 0) {
                if (haushalt < 0 || wp < 0) {
                    this.adapter.log.warn('wr < 0, haushalt < 0 || wp < 0 should not happen');
                    return;
                } else {
                    bezug = wp;
                    haushaltBezug = haushalt;
                    wpBezug = wp - haushalt;
                }
            } else {
                if (haushalt < 0) {
                    if (wp < 0) {
                        einspeisung = Math.abs(wp);
                        haushaltBezug = wrCurrent - Math.abs(haushalt);
                        wpBezug = Math.abs(haushalt) - Math.abs(wp);
                    } else {
                        bezug = wp;
                        haushaltBezug = wrCurrent - Math.abs(haushalt);
                        wpBezug = Math.abs(haushalt) + wp;
                    }
                } else {
                    if (wp < 0) {
                        this.adapter.log.warn('wr > 0, haushalt > 0 || wp < 0 should not happen');
                        return;
                    } else {
                        bezug = wp;
                        haushaltBezug = wrCurrent + haushalt;
                        wpBezug = wp - haushalt;
                    }
                }
            }

            StateUtils.setStateWithAck(this.adapter,STATES.current.prefix + STATES.current.wechselrichterEinspeisung, wechselrichterEinspeisung);
            StateUtils.setStateWithAck(this.adapter,STATES.current.prefix + STATES.current.verbrauchHaushalt, Math.max(haushaltBezug, 0));
            StateUtils.setStateWithAck(this.adapter,STATES.current.prefix + STATES.current.verbrauchWp, Math.max(wpBezug, 0));
            StateUtils.setStateWithAck(this.adapter,STATES.current.prefix + STATES.current.bezugNetz, bezug);
            StateUtils.setStateWithAck(this.adapter,STATES.current.prefix + STATES.current.einspeisungUeberschuss, einspeisung);
            StateUtils.setStateWithAck(this.adapter,STATES.current.prefix + STATES.current.haushaltBezugRaw, haushaltbezugRaw);
            StateUtils.setStateWithAck(this.adapter,STATES.current.prefix + STATES.current.wpBezugRaw, wpBezugRaw);
        }
    }

    async initializeStates(): Promise<any> {
        await StateUtils.createObject(this.adapter, STATES.total.prefix, STATES.total.wechselrichterCorrected, 'kWh');
        await StateUtils.createObject(this.adapter,STATES.total.prefix, STATES.total.wechselrichter, 'kWh');
        await StateUtils.createObject(this.adapter,STATES.total.prefix, STATES.total.bezugHaushalt, 'kWh');
        await StateUtils.createObject(this.adapter,STATES.total.prefix, STATES.total.einspeisungHaushalt, 'kWh');
        await StateUtils.createObject(this.adapter,STATES.total.prefix, STATES.total.bezugWp, 'kWh');
        await StateUtils.createObject(this.adapter,STATES.total.prefix, STATES.total.einspeisungWp, 'kWh');
        await StateUtils.createObject(this.adapter,STATES.total.prefix, STATES.total.eigenbedarfHaushalt, 'kWh');
        await StateUtils.createObject(this.adapter,STATES.total.prefix, STATES.total.eigenbedarfWp, 'kWh');
        await StateUtils.createObject(this.adapter,STATES.total.prefix, STATES.total.bezugNetz, 'kWh');
        await StateUtils.createObject(this.adapter,STATES.total.prefix, STATES.total.gesamtVerbrauchHaushalt, 'kWh');
        await StateUtils.createObject(this.adapter,STATES.total.prefix, STATES.total.gesamtVerbrauchWp, 'kWh');
        await StateUtils.createObject(this.adapter,STATES.total.prefix, STATES.total.anteilEigenbedarfHaushalt, '%');
        await StateUtils.createObject(this.adapter,STATES.total.prefix, STATES.total.anteilEigenbedarfWp, '%');
        await StateUtils.createObject(this.adapter,STATES.total.prefix, STATES.total.gesamtEigenverbrauch, '%');


        await StateUtils.createObject(this.adapter,STATES.current.prefix, STATES.current.wechselrichterEinspeisung, 'W');
        await StateUtils.createObject(this.adapter,STATES.current.prefix, STATES.current.verbrauchHaushalt, 'W');
        await StateUtils.createObject(this.adapter,STATES.current.prefix, STATES.current.verbrauchWp, 'W');
        await StateUtils.createObject(this.adapter,STATES.current.prefix, STATES.current.einspeisungUeberschuss, 'W');
        await StateUtils.createObject(this.adapter,STATES.current.prefix, STATES.current.bezugNetz, 'W');
        await StateUtils.createObject(this.adapter,STATES.current.prefix, STATES.current.haushaltBezugRaw, 'W');
        await StateUtils.createObject(this.adapter,STATES.current.prefix, STATES.current.wpBezugRaw, 'W');

        // await this.createObject('cumulated', 'cumulated');
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

    // createObject(prefix: string, state: string, unit: string): Promise<any> {
    //     return this.adapter.setObjectNotExistsAsync(prefix + state, {
    //         type: 'state',
    //         common: {
    //             name: state,
    //             type: 'number',
    //             role: 'variable',
    //             read: true,
    //             write: true,
    //             unit: unit
    //         },
    //         native: {},
    //     });
    // }
    //
    // setStateWithAck(state: string, value: string | number) {
    //     this.adapter.setStateAsync(state, {val: value, ack: true});
    // }

}
