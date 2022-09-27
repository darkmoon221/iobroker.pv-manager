import {CronJob} from 'cron';
import {PvManager} from '../main';
import {Notifier} from './notifier/notifier.interafce';
import {StateUtils} from './stateUtils';

export class CronJobs {

    private readonly adapter: PvManager;
    private readonly notifier: Notifier;

    cronExpression = '0 0 * * *';
    timezone = 'Europe/Berlin';

    historyPrefix = 'history.';

    constructor(pvManager: PvManager, notifier: Notifier) {
        this.adapter = pvManager;
        this.notifier = notifier;
    }

    async createDailyAtMidnight(): Promise<void> {

        this.adapter.log.debug('Create daily cron job at midnight: ' + this.cronExpression);

        new CronJob(
            this.cronExpression,
            () => this.createStatisticsForLastDay(),
            () => this.adapter.log.debug('cron job stopped'),
            true,
            this.timezone
        );
    }

    createStatisticsForLastDay(): void {
        this.initializeYesterday().then((state) => {
            this.adapter.log.debug('Created state: ' + state);

            this.adapter.getStateAsync('cumulated').then((data) => {
                this.adapter.log.debug('Copy state: ' + data);

                if (data && data.val) {
                    const value = data?.val;
                    this.adapter.log.debug('Set state: ' + value);
                    StateUtils.setStateWithAck(this.adapter, state, value.toString()).then(() => {
                        if (this.adapter.config.sendNotifications) {
                            this.notifier.sendNotification(value.toString()).then();
                        }
                    });
                }
            });
        });
    }

    async initializeYesterday(): Promise<string> {
        const yesterday = new Date(new Date().setDate(new Date().getDate() - 1));

        const state = this.historyPrefix + yesterday.getFullYear() + '.' + (yesterday.getMonth() + 1) + '.' + yesterday.getDate();

        await this.adapter.setObjectNotExistsAsync(state, {
            type: 'state',
            common: {
                name: state,
                type: 'object',
                role: 'variable',
                read: true,
                write: true
            },
            native: {},
        });
        return Promise.resolve(state);
    }

}
