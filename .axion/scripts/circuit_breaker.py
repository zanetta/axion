#!/usr/bin/env python3
"""
Decide whether a worker may run (P3 W-04).

Stateless: the caller passes counters for one domain. Defaults: a worker may
be retried twice (3 attempts total); 3 worker failures in the same domain open
the breaker.

    python3 .cursor/scripts/circuit_breaker.py --domain backend --domain-failures 0 --worker-failures 0

Exit 0: action is dispatch or retry. Launch the worker.
Exit 1: do not launch.
  reason domain-failures → stop the domain and write a partial synthesis.
  reason retry-limit → drop this worker; other workers in the domain may continue.
Exit 2: bad arguments. Nothing is written.
Stdout is one JSON object. No free text from workers.
"""

from __future__ import annotations

import argparse
import json
import re
import sys

TOKEN = re.compile(r"^[a-z0-9-]{1,40}$")
MAX_RETRIES = 2
TRIP_AFTER = 3
COUNT_LIMIT = 1000


def decide(domain: str, domain_failures: int, worker_failures: int, max_retries: int, trip_after: int) -> dict:
    if domain_failures >= trip_after:
        action, reason, fallback = "open", "domain-failures", "partial-synthesis"
    elif worker_failures > max_retries:
        action, reason, fallback = "stop-worker", "retry-limit", "abandon-worker"
    elif worker_failures > 0:
        action, reason, fallback = "retry", "within-limit", None
    else:
        action, reason, fallback = "dispatch", "closed", None
    return {
        "domain": domain,
        "action": action,
        "reason": reason,
        "fallback": fallback,
        "domain_failures": domain_failures,
        "worker_failures": worker_failures,
    }


def parse_count(value: str, name: str) -> int:
    if not re.fullmatch(r"[0-9]+", value):
        raise ValueError(f"{name} must be a non-negative integer")
    number = int(value)
    if number > COUNT_LIMIT:
        raise ValueError(f"{name} is too large")
    return number


def main() -> int:
    parser = argparse.ArgumentParser(description="Orchestration circuit breaker")
    parser.add_argument("--domain", required=True)
    parser.add_argument("--domain-failures", default="0")
    parser.add_argument("--worker-failures", default="0")
    parser.add_argument("--max-retries", default=str(MAX_RETRIES))
    parser.add_argument("--trip-after", default=str(TRIP_AFTER))
    args = parser.parse_args()

    if TOKEN.fullmatch(args.domain) is None:
        print("circuit_breaker: domain must be a short token", file=sys.stderr)
        return 2
    try:
        domain_failures = parse_count(args.domain_failures, "domain-failures")
        worker_failures = parse_count(args.worker_failures, "worker-failures")
        max_retries = parse_count(args.max_retries, "max-retries")
        trip_after = parse_count(args.trip_after, "trip-after")
    except ValueError as exc:
        print(f"circuit_breaker: {exc}", file=sys.stderr)
        return 2
    if trip_after < 1:
        print("circuit_breaker: trip-after must be at least 1", file=sys.stderr)
        return 2

    decision = decide(args.domain, domain_failures, worker_failures, max_retries, trip_after)
    print(json.dumps(decision))
    return 0 if decision["action"] in {"dispatch", "retry"} else 1


if __name__ == "__main__":
    sys.exit(main())
