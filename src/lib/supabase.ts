import { createBrowserClient } from "@supabase/ssr";

type EmptyQueryResult = {
  data: unknown[] | Record<string, unknown> | null;
  count?: number | null;
  error: unknown;
};

type EmptyBuilder = {
  select: (..._args: unknown[]) => EmptyBuilder;
  order: (..._args: unknown[]) => EmptyBuilder;
  eq: (..._args: unknown[]) => EmptyBuilder;
  insert: (payload: unknown) => {
    select: () => {
      single: () => Promise<{ data: unknown; error: null }>;
    };
    single: () => Promise<{ data: unknown; error: null }>;
  };
  update: (payload: unknown) => {
    eq: (..._args: unknown[]) => Promise<{ data: unknown; error: null }>;
    then: <T>(resolve: (value: unknown) => T, reject?: (reason?: unknown) => void) => Promise<T>;
  };
  delete: () => {
    eq: (..._args: unknown[]) => Promise<{ data: null; error: null }>;
  };
  single: () => Promise<{ data: unknown; error: null }>;
  maybeSingle: () => Promise<{ data: unknown; error: null }>;
  then: <T>(resolve: (value: EmptyQueryResult) => T, reject?: (reason?: unknown) => void) => Promise<T>;
};

const createEmptyQueryBuilder = (initialResult: EmptyQueryResult = { data: [], count: 0, error: null }): EmptyBuilder => {
  // The mock deliberately implements only the subset of Supabase used by the
  // app. Cast at the boundary so its lightweight promise-like helpers do not
  // need to reproduce every overload from the Supabase query builder.
  const builder = {
    select: (..._args: unknown[]) => builder,
    order: (..._args: unknown[]) => builder,
    eq: (..._args: unknown[]) => builder,
    insert: (payload: unknown) => ({
      select: () => ({
        single: async () => ({ data: Array.isArray(payload) ? payload[0] ?? null : payload ?? null, error: null }),
      }),
      single: async () => ({ data: Array.isArray(payload) ? payload[0] ?? null : payload ?? null, error: null }),
    }),
    update: (payload: unknown) => ({
      eq: async () => ({ data: payload, error: null }),
      then: (resolve, reject) => Promise.resolve({ data: payload, error: null }).then(resolve, reject),
    }),
    delete: () => ({
      eq: async () => ({ data: null, error: null }),
    }),
    single: async () => ({ data: initialResult.data ?? null, error: null }),
    maybeSingle: async () => ({ data: initialResult.data ?? null, error: null }),
    then: (resolve, reject) => Promise.resolve(initialResult).then(resolve as never, reject),
  } as EmptyBuilder;

  return builder;
};

const createStorageClient = () => ({
  from: () => ({
    upload: async (_path: string, _file: File) => ({ data: null, error: null }),
    getPublicUrl: (path: string) => ({ data: { publicUrl: `/placeholder/${path}` } }),
  }),
});

const createMockChannel = () => {
  const channel: any = {
    on: () => channel,
    subscribe: () => channel,
  };

  return channel;
};

const createEmptySupabaseClient = () => ({
  from: () => createEmptyQueryBuilder({ data: [], count: 0, error: null }),
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async (_credentials: { email: string; password: string }) => ({
      data: { user: null, session: null },
      error: null,
    }),
    signOut: async () => ({ error: null }),
  },
  storage: createStorageClient(),
  channel: () => createMockChannel(),
  removeChannel: () => undefined,
}) as any;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase =
  isSupabaseConfigured
    ? createBrowserClient(supabaseUrl!, supabaseAnonKey!)
    : createEmptySupabaseClient();
