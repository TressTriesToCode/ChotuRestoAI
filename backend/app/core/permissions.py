from enum import Enum

class UserRole(str, Enum):
    OWNER = "owner"
    MANAGER = "manager"
    CASHIER = "cashier"
    KITCHEN_STAFF = "kitchen_staff"
    WAITER = "waiter"

ROLE_PERMISSIONS = {
    UserRole.OWNER: ["*"],
    UserRole.MANAGER: [
        "settings:read",
        "settings:update",
        "staff:*",
        "pos:*",
        "menu:*",
        "orders:*",
        "kds:*",
        "inventory:*",
        "suppliers:*",
        "crm:*",
        "delivery:*",
        "analytics:*",
        "ai:*",
        "tables:*",
        "notifications:*",
    ],
    UserRole.CASHIER: [
        "pos:*",
        "orders:*",
        "tables:*",
        "payments:*",
        "delivery:read",
        "delivery:dispatch",
        "crm:*",
        "notifications:read",
    ],
    UserRole.WAITER: [
        "pos:orders",
        "tables:read",
        "tables:status",
        "tables:assign",
        "crm:read",
        "notifications:read",
    ],
    UserRole.KITCHEN_STAFF: [
        "kds:*",
        "orders:read",
        "inventory:read",
        "notifications:read",
    ],
}

def has_permission(role: UserRole, required_perm: str) -> bool:
    perms = ROLE_PERMISSIONS.get(role, [])
    if "*" in perms:
        return True
    req_group = required_perm.split(":")[0] if ":" in required_perm else required_perm
    for p in perms:
        if p == required_perm or p == f"{req_group}:*":
            return True
    return False
