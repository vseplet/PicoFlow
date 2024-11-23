import { Queue } from "./Queue.ts";
import type {
  FlowContextType,
  FlowStartupHandlerType,
  FlowTaskHandlerType,
  FlowTaskStateType,
  FlowWorkflowType,
} from "./types.ts";

export class Flow<C extends FlowContextType> extends Queue {
  private workflow: FlowWorkflowType<C> = {
    contextConstructor: () => {
      throw new Error("Not implemented!");
    },
    name: "unknown",
    tasks: {},
    startup: async () => {},
  };

  name(name: string): Flow<C> {
    this.workflow.name = name;
    return this;
  }

  context(constructor: new (params: Partial<C>) => C): Flow<C> {
    this.workflow.contextConstructor = (params) => new constructor(params);
    return this;
  }

  task<S extends FlowTaskStateType>(
    args: {
      name: string;
      handler: FlowTaskHandlerType<C, S>;
      initState?: () => S;
    },
  ): string {
    const taskState: S = args.initState ? args.initState() : {} as S;
    const taskName = `[${this.workflow.name}] ${args.name}`;

    this.workflow.tasks[taskName] = {
      name: taskName,
      handler: async (msg: any) => {
        try {
          await args.handler({
            ctx: msg,
            state: taskState,
            name: taskName,
            next: (...args) => this.next(...args),
          });
        } catch (e: unknown) {
          console.error(e);
        }
      },
    };

    return taskName;
  }

  next(
    name: string,
    params?: Partial<C> | Array<Partial<C>>,
  ): void {
    if (params) {
      if (params instanceof Array) {
        params.forEach((entry) => {
          const newContext = this.workflow.contextConstructor(entry);
          this.pub(name, newContext);
        });
      } else {
        this.pub(name, this.workflow.contextConstructor(params));
      }
    } else {
      this.pub(name, this.workflow.contextConstructor({}));
    }
  }

  startup(handler: FlowStartupHandlerType<C>): Flow<C> {
    this.workflow.startup = () => handler((...args) => this.next(...args));
    return this;
  }

  async start(): Promise<void> {
    for (const topic in this.workflow.tasks) {
      const task = this.workflow.tasks[topic];
      this.sub(task.name, task.handler);
      console.log(`subscribe ${task.name}`);
    }

    try {
      await this.workflow.startup();
    } catch (e: unknown) {
      console.error(e);
    }
  }
}
