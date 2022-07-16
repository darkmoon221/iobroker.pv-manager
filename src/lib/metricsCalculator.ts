import {PvManager} from '../main';
import {SensorData, STATES, TotalValues} from './model';

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

            const wrKWH = parseFloat(this.wechselRichterTotal) / 1000;
            // this.adapter.log.debug('Wechselrichter in kWh: ' + wrKWH);
            this.setStateWithAck(STATES.total.prefix + STATES.total.wechselrichter, wrKWH);

            const bezugHaushalt = sensorData.strom.bezug;
            // this.adapter.log.debug('Bezug Haushalt in kWh: ' + bezugHaushalt);
            this.setStateWithAck(STATES.total.prefix + STATES.total.bezugHaushalt, bezugHaushalt);


            const einspeisungHaushalt = sensorData.strom.einspeisung;
            // this.adapter.log.debug('Einspeisung Haushalt in kWh: ' + einspeisungHaushalt);
            this.setStateWithAck(STATES.total.prefix + STATES.total.einspeisungHaushalt, einspeisungHaushalt);


            const wpBezug = sensorData.heizung['1.8.0'];
            // this.adapter.log.debug('Bezug WP in kWh: ' + wpBezug);
            this.setStateWithAck(STATES.total.prefix + STATES.total.bezugWp, wpBezug);


            const wpEinspeisung = sensorData.heizung['2.8.0'];
            // this.adapter.log.debug('Einspeisung WP in kWh: ' + wpEinspeisung);
            this.setStateWithAck(STATES.total.prefix + STATES.total.einspeisungWp, wpEinspeisung);


            const eigenbedarfHaushalt = wrKWH - einspeisungHaushalt;
            // this.adapter.log.debug('Eigenbedarf Haushalt: ' + eigenbedarfHaushalt);
            this.setStateWithAck(STATES.total.prefix + STATES.total.eigenbedarfHaushalt, eigenbedarfHaushalt);


            const eigenbedarfWp = wrKWH - wpEinspeisung - eigenbedarfHaushalt;
            // this.adapter.log.debug('Eigenbedarf WP: ' + eigenbedarfWp);
            this.setStateWithAck(STATES.total.prefix + STATES.total.eigenbedarfWp, eigenbedarfWp);


            const bezugNetzWp = this.adapter.config.wpEnergyMeterTotalConsumptionBeforeChange + wpBezug - bezugHaushalt;
            // this.adapter.log.debug('Bezug Netz WP: ' + bezugNetzWp);
            this.setStateWithAck(STATES.total.prefix + STATES.total.bezugNetz, bezugNetzWp);


            const gesamtVerbrauchHaushalt = bezugHaushalt + eigenbedarfHaushalt;
            // this.adapter.log.debug('Gesamtverbrauch Haushalt: ' + gesamtVerbrauchHaushalt);
            this.setStateWithAck(STATES.total.prefix + STATES.total.gesamtVerbrauchHaushalt, gesamtVerbrauchHaushalt);


            const gesamtVerbrauchWP = bezugNetzWp + eigenbedarfWp;
            // this.adapter.log.debug('Gesamtverbrauch WP: ' + gesamtVerbrauchWP);
            this.setStateWithAck(STATES.total.prefix + STATES.total.gesamtVerbrauchWp, gesamtVerbrauchWP);


            const eigenbedarfHaushaltAnteil = eigenbedarfHaushalt * 100 / wrKWH;
            // this.adapter.log.debug('Eigenbedarf Haushalt %: ' + eigenbedarfHaushaltAnteil);
            this.setStateWithAck(STATES.total.prefix + STATES.total.anteilEigenbedarfHaushalt, eigenbedarfHaushaltAnteil);


            const eigenbedarfWpAnteil = eigenbedarfWp * 100 / wrKWH;
            // this.adapter.log.debug('Eigenbedarf WP %: ' + eigenbedarfWpAnteil);
            this.setStateWithAck(STATES.total.prefix + STATES.total.anteilEigenbedarfWp, eigenbedarfWpAnteil);


            const eigenbedarfGesamtAnteil = (eigenbedarfWp + eigenbedarfHaushalt) * 100 / wrKWH;
            // this.adapter.log.debug('Eigenbedarf gesamt %: ' + eigenbedarfGesamtAnteil);
            this.setStateWithAck(STATES.total.prefix + STATES.total.gesamtEigenverbrauch, eigenbedarfGesamtAnteil);


            const cumulated: TotalValues = {
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

            this.setStateWithAck('cumulated', JSON.stringify(cumulated));

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

            this.setStateWithAck(STATES.current.prefix + STATES.current.wechselrichterEinspeisung, wechselrichterEinspeisung);
            this.setStateWithAck(STATES.current.prefix + STATES.current.verbrauchHaushalt, Math.max(haushaltBezug, 0));
            this.setStateWithAck(STATES.current.prefix + STATES.current.verbrauchWp, Math.max(wpBezug, 0));
            this.setStateWithAck(STATES.current.prefix + STATES.current.bezugNetz, bezug);
            this.setStateWithAck(STATES.current.prefix + STATES.current.einspeisungUeberschuss, einspeisung);
            this.setStateWithAck(STATES.current.prefix + STATES.current.haushaltBezugRaw, haushaltbezugRaw);
            this.setStateWithAck(STATES.current.prefix + STATES.current.wpBezugRaw, wpBezugRaw);
        }
    }

    async intitializeStates(): Promise<any> {
        await this.createObject(STATES.total.prefix, STATES.total.wechselrichter, 'kWh');
        await this.createObject(STATES.total.prefix, STATES.total.bezugHaushalt, 'kWh');
        await this.createObject(STATES.total.prefix, STATES.total.einspeisungHaushalt, 'kWh');
        await this.createObject(STATES.total.prefix, STATES.total.bezugWp, 'kWh');
        await this.createObject(STATES.total.prefix, STATES.total.einspeisungWp, 'kWh');
        await this.createObject(STATES.total.prefix, STATES.total.eigenbedarfHaushalt, 'kWh');
        await this.createObject(STATES.total.prefix, STATES.total.eigenbedarfWp, 'kWh');
        await this.createObject(STATES.total.prefix, STATES.total.bezugNetz, 'kWh');
        await this.createObject(STATES.total.prefix, STATES.total.gesamtVerbrauchHaushalt, 'kWh');
        await this.createObject(STATES.total.prefix, STATES.total.gesamtVerbrauchWp, 'kWh');
        await this.createObject(STATES.total.prefix, STATES.total.anteilEigenbedarfHaushalt, '%');
        await this.createObject(STATES.total.prefix, STATES.total.anteilEigenbedarfWp, '%');
        await this.createObject(STATES.total.prefix, STATES.total.gesamtEigenverbrauch, '%');


        await this.createObject(STATES.current.prefix, STATES.current.wechselrichterEinspeisung, 'W');
        await this.createObject(STATES.current.prefix, STATES.current.verbrauchHaushalt, 'W');
        await this.createObject(STATES.current.prefix, STATES.current.verbrauchWp, 'W');
        await this.createObject(STATES.current.prefix, STATES.current.einspeisungUeberschuss, 'W');
        await this.createObject(STATES.current.prefix, STATES.current.bezugNetz, 'W');
        await this.createObject(STATES.current.prefix, STATES.current.haushaltBezugRaw, 'W');
        await this.createObject(STATES.current.prefix, STATES.current.wpBezugRaw, 'W');

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

    createObject(prefix: string, state: string, unit: string): Promise<any> {
        return this.adapter.setObjectNotExistsAsync(prefix + state, {
            type: 'state',
            common: {
                name: state,
                type: 'number',
                role: 'variable',
                read: true,
                write: true,
                unit: unit
            },
            native: {},
        });
    }

    setStateWithAck(state: string, value: string | number) {
        this.adapter.setStateAsync(state, {val: value, ack: true});
    }

}
