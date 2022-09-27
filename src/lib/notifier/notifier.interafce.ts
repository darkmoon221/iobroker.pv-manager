export interface Notifier {

    sendNotification(data: string): Promise<void>;

}
