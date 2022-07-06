
import {PvManager} from '../main'

export class MetricsCalculator {

    private readonly adapter: PvManager;

    private wechselRichterTotal = '';

    constructor(pvMaanger: PvManager) {
        this.adapter = pvMaanger;
    }


    updateWechselRichterTotal(total: string | undefined): void {
        if(total) {
            this.wechselRichterTotal = total;
            this.adapter.log.debug('Update WechselrichterTotal: ' + this.wechselRichterTotal);
        }
    }


}