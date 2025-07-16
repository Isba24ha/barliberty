import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Get the base URL based on environment
const getBaseUrl = () => {
  if (typeof window === 'undefined') return ''; // Server-side rendering
  
  // In development and production, use the current host since we're serving from the same port
  return window.location.origin;
};

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getBaseUrl();
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  
  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // Include cookies for cross-origin requests
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getBaseUrl();
    const url = queryKey.join("/") as string;
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
    
    const res = await fetch(fullUrl, {
      credentials: "include", // Include cookies for cross-origin requests
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
      gcTime: 0, // Don't cache in deployment scenarios
    },
    mutations: {
      retry: false,
      onError: (error) => {
        console.error("Mutation error:", error);
      },
    },
  },
});
