export type QueueMessage<D> = { topic: string; data: D };

export type FlowContextType = { [key: string]: any };

export type FlowContextConstructorType<C> = (params: Partial<C>) => C;

export type FlowTaskStateType = { [key: string]: any };

export type FlowNextType<C extends FlowContextType> = (
  name: string,
  params?: Partial<C> | Array<Partial<C>>,
) => void;

export type FlowStartupHandlerType<C extends FlowContextType> = (
  call: FlowNextType<C>,
) => Promise<void>;

export type FlowTaskHandlerType<
  C extends FlowContextType,
  S extends FlowTaskStateType,
> = (
  args: {
    ctx: C;
    state: S;
    name: string;
    next: FlowNextType<C>;
  },
) => Promise<void>;

export type FlowTaskType<
  C extends FlowContextType,
  S extends FlowTaskStateType,
> = {
  name: string;
  handler: FlowTaskHandlerType<C, S>;
};

export type FlowWorkflowType<C extends FlowContextType> = {
  name: string;
  contextConstructor: FlowContextConstructorType<C>;
  tasks: {
    [name: string]: FlowTaskType<C, any>;
  };
  startup: () => Promise<void>;
};
