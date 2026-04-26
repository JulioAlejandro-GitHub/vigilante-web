import type { CurrentUser } from "../types/session";

export function authUserFixture(patch: Partial<CurrentUser> = {}): CurrentUser {
  return {
    user_id: "00000000-0000-0000-0000-000000000101",
    username: "julio",
    email: "julio@example.test",
    name: "Julio Analyst",
    display_name: "Julio Analyst",
    role: "analyst",
    roles: ["analyst"],
    is_active: true,
    organization_id: "org-1",
    site_id: "site-1",
    organization_ids: ["org-1"],
    site_ids: ["site-1"],
    scopes: [
      {
        organization_id: "org-1",
        site_ids: ["site-1"],
        all_sites: false,
        scope_role: "operator",
        can_view: true,
        can_operate: true,
        can_admin: false,
      },
    ],
    ...patch,
  };
}
