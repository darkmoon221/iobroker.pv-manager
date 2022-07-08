import {PvManager} from '../main';
import {SensorData, STATES} from './model';

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
            this.adapter.log.warn('Before calcMetrtics');
            this.calculateMetrics();
            this.calculateLiveConsumption();
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

        this.adapter.log.warn('In calcMetrtics');

        if (this.wechselRichterTotal) {

            const sensorData: SensorData = this.getSensorData();
            this.adapter.log.debug('Sensordata: ' + JSON.stringify(sensorData));

            const wrKWH = parseFloat(this.wechselRichterTotal) / 1000;
            this.adapter.log.debug('Wechselrichter in kWh: ' + wrKWH);
            this.setStateWithAck(STATES.total.prefix + STATES.total.wechselrichter, wrKWH);

            const bezugHaushalt = sensorData.strom.bezug;
            this.adapter.log.debug('Bezug Haushalt in kWh: ' + bezugHaushalt);
            this.setStateWithAck(STATES.total.prefix + STATES.total.bezugHaushalt, bezugHaushalt);


            const einspeisungHaushalt = sensorData.strom.einspeisung;
            this.adapter.log.debug('Einspeisung Haushalt in kWh: ' + einspeisungHaushalt);
            this.setStateWithAck(STATES.total.prefix + STATES.total.einspeisungHaushalt, einspeisungHaushalt);


            const wpBezug = sensorData.heizung['1.8.0'];
            this.adapter.log.debug('Bezug WP in kWh: ' + wpBezug);
            this.setStateWithAck(STATES.total.prefix + STATES.total.bezugWp, wpBezug);


            const wpEinspeisung = sensorData.heizung['2.8.0'];
            this.adapter.log.debug('Einspeisung WP in kWh: ' + wpEinspeisung);
            this.setStateWithAck(STATES.total.prefix + STATES.total.einspeisungWp, wpEinspeisung);


            const eigenbedarfHaushalt = wrKWH - einspeisungHaushalt;
            this.adapter.log.debug('Eigenbedarf Haushalt: ' + eigenbedarfHaushalt);
            this.setStateWithAck(STATES.total.prefix + STATES.total.eigenbedarfHaushalt, eigenbedarfHaushalt);


            const eigenbedarfWp = wrKWH - wpEinspeisung - eigenbedarfHaushalt;
            this.adapter.log.debug('Eigenbedarf WP: ' + eigenbedarfWp);
            this.setStateWithAck(STATES.total.prefix + STATES.total.eigenbedarfWp, eigenbedarfWp);


            const bezugNetzWp = this.adapter.config.option2 + wpBezug - bezugHaushalt;
            this.adapter.log.debug('Bezug Netz WP: ' + bezugNetzWp);
            this.setStateWithAck(STATES.total.prefix + STATES.total.bezugNetz, bezugNetzWp);


            const gesamtVerbrauchHaushalt = bezugHaushalt + eigenbedarfHaushalt;
            this.adapter.log.debug('Gesamtverbrauch Haushalt: ' + gesamtVerbrauchHaushalt);
            this.setStateWithAck(STATES.total.prefix + STATES.total.gesamtVerbrauchHaushalt, gesamtVerbrauchHaushalt);


            const gesamtVerbrauchWP = bezugNetzWp + eigenbedarfWp;
            this.adapter.log.debug('Gesamtverbrauch WP: ' + gesamtVerbrauchWP);
            this.setStateWithAck(STATES.total.prefix + STATES.total.gesamtVerbrauchWp, gesamtVerbrauchWP);


            const eigenbedarfHaushaltAnteil = eigenbedarfHaushalt * 100 / wrKWH;
            this.adapter.log.debug('Eigenbedarf Haushalt %: ' + eigenbedarfHaushaltAnteil);
            this.setStateWithAck(STATES.total.prefix + STATES.total.anteilEigenbedarfHaushalt, eigenbedarfHaushaltAnteil);


            const eigenbedarfWpAnteil = eigenbedarfWp * 100 / wrKWH;
            this.adapter.log.debug('Eigenbedarf WP %: ' + eigenbedarfWpAnteil);
            this.setStateWithAck(STATES.total.prefix + STATES.total.anteilEigenbedarfWp, eigenbedarfWpAnteil);


            const eigenbedarfGesamtAnteil = (eigenbedarfWp + eigenbedarfHaushalt) * 100 / wrKWH;
            this.adapter.log.debug('Eigenbedarf gesamt %: ' + eigenbedarfGesamtAnteil);
            this.setStateWithAck(STATES.total.prefix + STATES.total.gesamtEigenverbrauch, eigenbedarfGesamtAnteil);

        }
    }

    calculateLiveConsumption(): void {
        if (this.wechselRichterCurrent) {
            const sensorData = this.getSensorData();

            this.adapter.log.debug('Update energy meter data: ' + JSON.stringify(sensorData));


            const wrEinspeisung = parseFloat(this.wechselRichterCurrent);
            this.adapter.log.debug('WR Einspeisung: ' + wrEinspeisung);
            this.setStateWithAck(STATES.current.prefix + STATES.current.wechselrichterEinspeisung, wrEinspeisung);

            const bezugHaushaltRaw = sensorData.strom.aktleist;
            const bezugWpRaw = sensorData.heizung.aktleist;

            this.adapter.log.debug('Haushalt Bezug (raw): ' + bezugHaushaltRaw);
            this.adapter.log.debug('WR Bezug (raw): ' + bezugWpRaw);


            if (bezugHaushaltRaw < 0) {

                const verbrauchHaushalt = wrEinspeisung - Math.abs(bezugHaushaltRaw);
                this.adapter.log.debug('Verbrauch Haushalt: ' + verbrauchHaushalt);
                this.setStateWithAck(STATES.current.prefix + STATES.current.verbrauchHaushalt, verbrauchHaushalt);


                if (bezugWpRaw < 0) {
                    const verbrauchWp = Math.abs(bezugHaushaltRaw) - Math.abs(bezugWpRaw);
                    this.adapter.log.debug('Verbrauch WP: ' + verbrauchWp);
                    this.adapter.log.debug('Einspeisung Überschuss: ' + Math.abs(bezugWpRaw));

                    this.setStateWithAck(STATES.current.prefix + STATES.current.verbrauchWp, verbrauchWp);
                    this.setStateWithAck(STATES.current.prefix + STATES.current.einspeisungUeberschuss, Math.abs(bezugWpRaw));


                } else {
                    const verbrauchWp = Math.abs(bezugHaushaltRaw) + bezugWpRaw;
                    this.adapter.log.debug('Verbrauch WP: ' + verbrauchWp);
                    this.setStateWithAck(STATES.current.prefix + STATES.current.verbrauchWp, verbrauchWp);


                    const einspeisung = 0;
                    this.adapter.log.debug('Einspeisung Überschuss: ' + einspeisung);
                    this.setStateWithAck(STATES.current.prefix + STATES.current.einspeisungUeberschuss, einspeisung);


                    const bezugNetz = bezugWpRaw;
                    this.adapter.log.debug('Bezug Netz: ' + bezugNetz);
                    this.setStateWithAck(STATES.current.prefix + STATES.current.bezugNetz, bezugNetz);

                }
            } else {
                const verbrauchHaushalt = wrEinspeisung + bezugHaushaltRaw;
                this.adapter.log.debug('Verbrauch Haushalt: ' + verbrauchHaushalt);
                this.setStateWithAck(STATES.current.prefix + STATES.current.verbrauchHaushalt, verbrauchHaushalt);


                const verbrauchWp = bezugWpRaw - bezugHaushaltRaw;
                this.adapter.log.debug('Verbrauch WP: ' + verbrauchWp);
                this.setStateWithAck(STATES.current.prefix + STATES.current.verbrauchWp, verbrauchWp);


                const einspeisung = 0;
                this.adapter.log.debug('Einspeisung Überschuss: ' + einspeisung);
                this.setStateWithAck(STATES.current.prefix + STATES.current.einspeisungUeberschuss, einspeisung);


                const bezugNetz = bezugWpRaw;
                this.adapter.log.debug('Bezug Netz: ' + bezugNetz);
                this.setStateWithAck(STATES.current.prefix + STATES.current.bezugNetz, bezugNetz);

            }
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