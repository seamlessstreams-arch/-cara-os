"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type {
  CommsChannelSummary,
  CommsMessageEnriched,
  CommsMessagePriority,
  CommsLinkedRecordType,
} from "@/types/comms";

export function useCommsChannels() {
  return useQuery({
    queryKey: ["comms", "channels"],
    queryFn: async () => (await api.get<{ data: CommsChannelSummary[] }>("/comms/channels")).data ?? [],
    staleTime: 15_000,
  });
}

export function useChannelMessages(channelId: string | null) {
  return useQuery({
    queryKey: ["comms", "messages", channelId],
    queryFn: async () =>
      (await api.get<{ data: CommsMessageEnriched[] }>(`/comms/messages?channel_id=${channelId}`)).data ?? [],
    enabled: !!channelId,
    staleTime: 5_000,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      channel_id: string;
      body: string;
      priority?: CommsMessagePriority;
      requires_acknowledgement?: boolean;
      linked_child_id?: string | null;
      linked_incident_id?: string | null;
      linked_record_type?: CommsLinkedRecordType | null;
      linked_record_id?: string | null;
    }) => api.post<{ data: CommsMessageEnriched }>("/comms/messages", payload),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["comms", "messages", vars.channel_id] });
      qc.invalidateQueries({ queryKey: ["comms", "channels"] });
    },
  });
}

export function useMarkReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, channelId, acknowledge }: { messageId: string; channelId: string; acknowledge?: boolean }) =>
      api.post(`/comms/messages/${messageId}/receipt`, { acknowledge: !!acknowledge }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["comms", "messages", vars.channelId] });
      qc.invalidateQueries({ queryKey: ["comms", "channels"] });
    },
  });
}

export function useEditMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, body }: { messageId: string; channelId: string; body: string }) =>
      api.patch(`/comms/messages/${messageId}`, { body }),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["comms", "messages", vars.channelId] }),
  });
}

export function useDeleteMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId }: { messageId: string; channelId: string }) => api.delete(`/comms/messages/${messageId}`),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["comms", "messages", vars.channelId] }),
  });
}

export function useTrustNotice() {
  return useQuery({
    queryKey: ["comms", "trust-notice"],
    queryFn: async () =>
      (await api.get<{ data: { version: string; acknowledged: boolean; acknowledged_at: string | null } }>("/comms/trust-notice")).data,
    staleTime: 60_000,
  });
}

export function useAcknowledgeTrustNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/comms/trust-notice", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comms", "trust-notice"] }),
  });
}
