export interface SensorData {
    time: Date;
    strom: Strom;
    heizung: Heizung;
}

export interface Strom {
    bezug: number;
    einspeisung: number;
    aktleist: number;
}

export interface Heizung {
    '1.8.0': number;
    '2.8.0': number;
    aktleist: number;
}


export class Total {
    prefix = 'total.';

    wechselrichter = 'wechselrichter';
    bezugHaushalt = 'bezugHaushalt';
    einspeisungHaushalt = 'einspeisungHaushalt';

    bezugWp = 'bezugWp';
    einspeisungWp = 'einspeisungWp';

    eigenbedarfHaushalt = 'eigenbedarfHaushalt';
    eigenbedarfWp = 'eigenbedarfWp';

    bezugNetz = 'bezugNetz';

    gesamtVerbrauchHaushalt = 'gesamtVerbrauchHaushalt';
    gesamtVerbrauchWp = 'gesamtVerbrauchWp';

    anteilEigenbedarfHaushalt = 'anteilEigenbedarfHaushalt';
    anteilEigenbedarfWp = 'anteilEigenbedarfWp';

    gesamtEigenverbrauch = 'gesamtEigenverbrauch';
}


export class Current {
    prefix = 'current.';

    wechselrichterEinspeisung = 'wechselrichterEinspeisung';

    haushaltBezugRaw = 'haushaltBezugRaw';
    wpBezugRaw = 'wpBezugRaw';

    verbrauchHaushalt = 'verbrauchHaushalt';
    verbrauchWp = 'verbrauchWp';

    einspeisungUeberschuss = 'einspeisungUeberschuss';
    bezugNetz = 'bezugNetz';

}

export class States {

    total: Total = new Total();
    current: Current = new Current();

}

export const STATES = new States();

export interface TotalValues {

    wechselrichter: number;
    bezugHaushalt: number;
    einspeisungHaushalt: number;

    bezugWp: number;
    einspeisungWp: number;

    eigenbedarfHaushalt: number;
    eigenbedarfWp: number;

    bezugNetz: number;

    gesamtVerbrauchHaushalt : number;
    gesamtVerbrauchWp : number;

    anteilEigenbedarfHaushalt: number;
    anteilEigenbedarfWp: number;

    gesamtEigenverbrauch: number;
}
