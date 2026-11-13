// Database admission is shared by every Edge isolate. A token fences stale workers.
export async function acquireTick(client: any, interaction: boolean, token: string) {
  const { data, error } = await client.rpc("acquire_hive_tick", {
    p_token: token, p_interaction: interaction,
  });
  if (error) throw new Error("tick admission unavailable");
  return data === true;
}

export async function releaseTick(client: any, token: string) {
  const { error } = await client.rpc("release_hive_tick", { p_token: token });
  if (error) console.error("tick release failed"); // Lease expiry remains the recovery path.
}
