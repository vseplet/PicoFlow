import type { QueueMessage } from "./types.ts";

export class Queue {
  private subscribes: { [topic: string]: Array<any> } = {};
  private queue: Array<QueueMessage<unknown>> = [];

  private update() {
    const msg = this.queue.pop();
    if (!msg) return;

    if (!this.subscribes[msg.topic]) return;
    this.subscribes[msg.topic].forEach((cb) => {
      try {
        cb(msg.data);
      } catch (e: unknown) {
        console.error(e);
      }
    });
  }

  pub<D>(topic: string, data: D) {
    this.queue.unshift({ topic, data });
    this.update();
  }

  sub<D>(topic: string, callback: (data: D) => void | Promise<void>) {
    if (this.subscribes[topic] === undefined) this.subscribes[topic] = [];
    this.subscribes[topic].push(callback);
  }
}
