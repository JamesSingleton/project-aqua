# 0003. CTS timing interface: Rust transport, TypeScript codec

- **Status:** Proposed (documented, not yet built)
- **Date:** 2026-09-28

## Context

Colorado Time Systems consoles (System 6, System 5, 4000A, and Gen7) expose stored race results as a queryable database over RS232. The protocol is summarized in the [companion spec](../specs/desktop-companion-v1.spec.md#cts-meet-management-interface), from CTS document F397 Rev. F. It has two layers with very different needs:

- **Transport:** 9600 baud, odd parity, 8N1, framed packets with a 2-byte checksum. There are hard timing windows:
  - at most 50 ms between bytes;
  - a response starts within 500 ms, otherwise resend;
  - once the first byte arrives, the rest of the packet follows within 500 ms.

  JavaScript timers in a webview can't guarantee these windows, and the webview can't open serial ports.
- **Payload:** a race header struct, then per-lane places, splits, button times, backups, and relay judging. This is pure data decoding, the same kind of work `@lane4hq/swim-formats` already does with golden tests.

## Decision

- **Rust (`apps/desktop/src-tauri`) owns transport:**
  - port discovery (`COMx` on Windows, `/dev/cu.*` on macOS);
  - opening the port at 9600/odd/8/1;
  - framing (`NUM | DATA | DIC`);
  - DIC verification;
  - inter-byte and response timeouts, with retry.

  It exposes Tauri commands that take a command payload and return verified `DATA` bytes, or a typed transport error. It uses the `serialport` crate, with Rust unit tests for framing and DIC.
- **A TypeScript package, `@lane4hq/timing-cts`, owns the codec:**
  - building command payloads (`W`, `T`, `M+`/`M-`, `S` with sub-commands);
  - decoding the race header and lane records;
  - mapping the 6-byte error codes;
  - converting to a neutral `TimerRace` model.

  It has no DOM or Tauri dependency. It needs 100% Vitest coverage, with golden vectors taken from the vendor document's hex examples (for example `05 00 57 A3 FF` for `W` and the ACK `06 00 06 00 F3 FF`).
- **A timer simulator** implements the same command/response behaviour in TypeScript. That lets development, UI work, and CI run with no hardware. Rust transport tests use a loopback or mock port.
- **v1 is read-only.** It only issues `W`, `T`, `M±`, and `S…`. Setups writes (`I…`) are deferred, because rewriting event-sequence labels corrupts the titles of races already stored on the timer.

## Consequences

- Timing-sensitive code stays small, in Rust, and testable without a webview. Decoding follows the repo's golden-test discipline.
- Framing logic lives in two places: Rust for the wire, TS for the simulator and tests. Shared test vectors keep them in sync.
- Field widths the vendor doc leaves implicit must be confirmed on real hardware before the codec is marked stable. Examples: `int` in `TYPE_MEETMGMT_HEADER` (assumed 2-byte little-endian) and `MAX_NUM_LANES`.
