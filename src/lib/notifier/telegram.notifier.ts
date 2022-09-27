import TelegramBot from 'node-telegram-bot-api';
import {PvManager} from '../../main';
import {Notifier} from './notifier.interafce';

export class TelegramNotifier implements Notifier {

    adapter: PvManager;

    bot: TelegramBot;

    chatId: string;

    constructor(adapter: PvManager) {
        this.adapter = adapter;

        this.chatId = this.adapter.config.telegramChatId;
        this.bot = new TelegramBot(this.adapter.config.telegramBotToken, {polling: false});
    }

    async sendNotification(data: string): Promise<void> {
        this.bot.sendMessage(this.chatId, data).then(() => this.adapter.log.debug('Sent telegram message'));
    }

}
