"""Minimal hand-rolled BIND zone-file parser and renderer.

Supports a documented subset sufficient for the Route53 clone:
  - $TTL and $ORIGIN directives
  - @ and relative/absolute owner names
  - record types: A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA, SOA
  - optional TTL and optional IN class token per line
  - ';' line comments (outside of quotes)

Parsing is tolerant: malformed lines are reported, never fatal.
"""
from dataclasses import dataclass
from typing import List, Tuple

SUPPORTED_TYPES = {
    "A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA",
}
_CLASSES = {"IN", "CH", "HS"}


@dataclass
class ParsedRecord:
    name: str
    type: str
    ttl: int
    value: str


def _strip_comment(line: str) -> str:
    """Remove a ';' comment that is outside of double quotes."""
    out = []
    in_quote = False
    for ch in line:
        if ch == '"':
            in_quote = not in_quote
        if ch == ";" and not in_quote:
            break
        out.append(ch)
    return "".join(out)


def _normalize_name(raw: str, origin: str) -> str:
    """Normalize an owner name to a fully-qualified, lowercased, dotted name."""
    name = raw.strip()
    if name == "@" or name == "":
        return origin
    name = name.lower()
    if name.endswith("."):
        return name
    base = origin.rstrip(".")
    return f"{name}.{base}." if base else f"{name}."


def parse_zone(content: str, zone_name: str) -> Tuple[List[ParsedRecord], List[str]]:
    """Parse a BIND zone file body into ParsedRecord rows plus a list of errors.

    `zone_name` is the hosted zone's name (dotted) and is the default $ORIGIN.
    """
    records: List[ParsedRecord] = []
    errors: List[str] = []

    if not content or not content.strip():
        return records, ["empty content"]

    origin = zone_name if zone_name.endswith(".") else zone_name + "."
    default_ttl = 300
    last_owner = origin

    for lineno, raw_line in enumerate(content.splitlines(), start=1):
        line = _strip_comment(raw_line).strip()
        if not line:
            continue

        # Directives
        if line.upper().startswith("$TTL"):
            parts = line.split()
            if len(parts) >= 2 and parts[1].isdigit():
                default_ttl = int(parts[1])
            else:
                errors.append(f"line {lineno}: malformed $TTL: {line}")
            continue
        if line.upper().startswith("$ORIGIN"):
            parts = line.split()
            if len(parts) >= 2:
                origin = _normalize_name(parts[1], origin)
                last_owner = origin
            else:
                errors.append(f"line {lineno}: malformed $ORIGIN: {line}")
            continue

        tokens = line.split()
        if not tokens:
            continue

        idx = 0
        # Determine whether the first token is an owner name. If the first token
        # is a TTL (numeric), a class, or a known type, the owner is omitted and
        # reuses the previous owner (standard BIND behavior).
        first = tokens[0]
        first_upper = first.upper()
        if first.isdigit() or first_upper in _CLASSES or first_upper in SUPPORTED_TYPES:
            owner = last_owner
        else:
            owner = _normalize_name(first, origin)
            last_owner = owner
            idx = 1

        ttl = default_ttl
        # Optional TTL
        if idx < len(tokens) and tokens[idx].isdigit():
            ttl = int(tokens[idx])
            idx += 1
        # Optional class
        if idx < len(tokens) and tokens[idx].upper() in _CLASSES:
            idx += 1
        # Optional TTL after class (rare ordering)
        if idx < len(tokens) and tokens[idx].isdigit():
            ttl = int(tokens[idx])
            idx += 1

        if idx >= len(tokens):
            errors.append(f"line {lineno}: missing record type: {line}")
            continue

        rtype = tokens[idx].upper()
        idx += 1
        if rtype not in SUPPORTED_TYPES:
            errors.append(f"line {lineno}: unsupported record type '{rtype}': {line}")
            continue

        rdata = " ".join(tokens[idx:]).strip()
        if not rdata:
            errors.append(f"line {lineno}: missing record data: {line}")
            continue

        records.append(ParsedRecord(name=owner, type=rtype, ttl=ttl, value=rdata))

    return records, errors


def render_zone(zone_name: str, default_ttl: int, records) -> str:
    """Render a zone and its records as a BIND zone file string.

    `records` is an iterable of objects with .name, .type, .ttl, .value
    (value may contain newline-separated multi-values).
    """
    origin = zone_name if zone_name.endswith(".") else zone_name + "."
    lines = [f"$ORIGIN {origin}", f"$TTL {default_ttl}"]

    # Column widths for readability
    for rec in records:
        name = rec.name if rec.name.endswith(".") else rec.name + "."
        values = [v for v in str(rec.value).split("\n") if v.strip() != ""]
        if not values:
            values = [""]
        for val in values:
            lines.append(
                f"{name}\t{rec.ttl}\tIN\t{rec.type}\t{val}"
            )
    return "\n".join(lines) + "\n"
