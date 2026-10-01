import { useQuery } from "@tanstack/react-query"
import { getDirectory } from "@/api/directory"
import { queryKeys } from "@/lib/queryClient"
export function useDirectory() {
  return useQuery({
    queryKey: queryKeys.directory,
    queryFn: getDirectory,
    staleTime: 60_000,
  })
}
