"""Helper utilities."""
import random
import string


def generate_zone_id() -> str:
    """Generate a Route53-style hosted zone id, e.g. Z1D633PJN98FT9."""
    chars = string.ascii_uppercase + string.digits
    return "Z" + "".join(random.choices(chars, k=13))
