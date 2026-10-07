"""Per-type DNS record value validation.

Validates that a record's value matches the expected format for its type.
Multi-value records (newline-separated) are validated per line.
"""
import ipaddress
import re

_HOSTNAME_RE = re.compile(
    r"^(?=.{1,253}\.?$)([a-zA-Z0-9_](?:[a-zA-Z0-9_-]{0,61}[a-zA-Z0-9_])?\.)*"
    r"[a-zA-Z0-9_](?:[a-zA-Z0-9_-]{0,61}[a-zA-Z0-9_])?\.?$"
)


def _is_ipv4(v: str) -> bool:
    try:
        return isinstance(ipaddress.ip_address(v.strip()), ipaddress.IPv4Address)
    except ValueError:
        return False


def _is_ipv6(v: str) -> bool:
    try:
        return isinstance(ipaddress.ip_address(v.strip()), ipaddress.IPv6Address)
    except ValueError:
        return False


def _is_hostname(v: str) -> bool:
    return bool(_HOSTNAME_RE.match(v.strip()))


def validate_record_value(rtype: str, value: str) -> None:
    """Raise ValueError if `value` is not valid for the record `rtype`.

    Values may contain multiple entries separated by newlines; each is checked.
    """
    rtype = rtype.upper()
    lines = [ln.strip() for ln in value.split("\n") if ln.strip()]
    if not lines:
        raise ValueError("value is required")

    for v in lines:
        if rtype == "A":
            if not _is_ipv4(v):
                raise ValueError(f"'{v}' is not a valid IPv4 address for an A record")
        elif rtype == "AAAA":
            if not _is_ipv6(v):
                raise ValueError(f"'{v}' is not a valid IPv6 address for an AAAA record")
        elif rtype in ("CNAME", "NS", "PTR"):
            if not _is_hostname(v):
                raise ValueError(f"'{v}' is not a valid domain name for a {rtype} record")
        elif rtype == "MX":
            # "<priority> <mail-server>"
            parts = v.split()
            if len(parts) != 2 or not parts[0].isdigit() or not _is_hostname(parts[1]):
                raise ValueError(
                    f"MX record must be 'priority hostname', e.g. '10 mail.example.com.' (got '{v}')"
                )
        elif rtype == "SRV":
            # "<priority> <weight> <port> <target>"
            parts = v.split()
            if (
                len(parts) != 4
                or not all(p.isdigit() for p in parts[:3])
                or not _is_hostname(parts[3])
            ):
                raise ValueError(
                    f"SRV record must be 'priority weight port target' (got '{v}')"
                )
        elif rtype == "CAA":
            # "<flags> <tag> <value>"
            parts = v.split(None, 2)
            if len(parts) < 3 or not parts[0].isdigit():
                raise ValueError(
                    f"CAA record must be 'flags tag \"value\"', e.g. '0 issue \"amazon.com\"' (got '{v}')"
                )
        # TXT and SOA: accept free-form text (no strict format check)
