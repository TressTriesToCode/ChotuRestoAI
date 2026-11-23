from enum import Enum

class UserRole(str, Enum):
    OWNER = "owner"
    MANAGER = "manager"
    CASHIER = "cashier"
    KITCHEN_STAFF = "kitchen_staff"
    WAITER = "waiter"

ROLE_PERMISSIONS = {
    UserRole.OWNER: ["*"],
    UserRole.MANAGER: ["pos:*", "menu:*", "orders:*", "kds:*", "inventory:*", "analytics:*", "ai:*", "tables:*"],
    UserRole.CASHIER: ["pos:*", "orders:*", "tables:*", "payments:*"],
    UserRole.KITCHEN_STAFF: ["kds:*", "orders:read", "inventory:read"],
    UserRole.WAITER: ["pos:orders", "tables:read", "tables:status"],
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
