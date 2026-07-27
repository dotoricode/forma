# Policy refresh — design notes (synthetic)

Cached policy is trusted immediately at startup so app launch never blocks
on network. Refresh runs in the background with bounded retries.

If refresh keeps failing and the cached policy gets old, the SDK should
degrade gracefully rather than keep operating on a stale policy forever —
exact staleness threshold to be finalized by the policy team.
