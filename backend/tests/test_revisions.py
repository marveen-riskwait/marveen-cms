"""Page revisions: content updates snapshot history; a revision can be restored."""
from __future__ import annotations


def _new_page(admin, **over):
    body = {"title": "Versionnée", "slug": "versionnee", "status": "draft",
            "blocks": [{"type": "text", "data": {"html": "<p>v1</p>"}}]}
    body.update(over)
    return admin.post("/api/pages", json=body).get_json()["data"]


def test_update_creates_revision(admin):
    page = _new_page(admin, slug="rev-create")
    pid = page["id"]
    # No history yet.
    assert admin.get(f"/api/pages/{pid}/revisions").get_json()["meta"]["total"] == 0

    admin.patch(f"/api/pages/{pid}", json={"blocks": [{"type": "text", "data": {"html": "<p>v2</p>"}}]})
    revs = admin.get(f"/api/pages/{pid}/revisions").get_json()
    assert revs["meta"]["total"] == 1
    assert revs["items"][0]["number"] == 1
    assert revs["items"][0]["author_name"]  # captured the editor


def test_non_content_change_does_not_snapshot(admin):
    page = _new_page(admin, slug="rev-nochange")
    pid = page["id"]
    admin.patch(f"/api/pages/{pid}", json={"status": "published"})
    assert admin.get(f"/api/pages/{pid}/revisions").get_json()["meta"]["total"] == 0


def test_restore_revision(admin):
    page = _new_page(admin, slug="rev-restore")
    pid = page["id"]
    # v1 -> v2
    admin.patch(f"/api/pages/{pid}", json={"blocks": [{"type": "text", "data": {"html": "<p>v2</p>"}}]})
    rev = admin.get(f"/api/pages/{pid}/revisions").get_json()["items"][0]  # snapshot of v1

    restored = admin.post(f"/api/pages/{pid}/revisions/{rev['id']}/restore")
    assert restored.status_code == 200
    assert restored.get_json()["data"]["blocks"][0]["data"]["html"] == "<p>v1</p>"

    # Restoring also snapshotted the pre-restore (v2) state.
    assert admin.get(f"/api/pages/{pid}/revisions").get_json()["meta"]["total"] == 2


def test_restore_unknown_revision_404(admin):
    page = _new_page(admin, slug="rev-404")
    assert admin.post(f"/api/pages/{page['id']}/revisions/99999/restore").status_code == 404
