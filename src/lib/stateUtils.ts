import {PvManager} from '../main';


export class StateUtils {

    static createObject(adapter: PvManager, prefix: string, state: string, unit?: string): Promise<any> {
        return adapter.setObjectNotExistsAsync(prefix + state, {
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

    static async setStateWithAck(adapter: PvManager, state: string, value: string | number): Promise<void> {
        adapter.setStateAsync(state, {val: value, ack: true}).then((state) => adapter.log.debug('State has been set: ' + state));
    }

}
