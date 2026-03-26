"use client";

import { useState, useTransition } from "react";
import styles from "../styles/pages/TripSubpage.module.scss";

export type OutfitItemDto = {
  id: string;
  dayNumber: number; // stored for future use, but hidden in UI
  title: string;
  items: string[];
  notes: string;
};

function parseItems(raw: string) {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function TripOutfits({
  tripSlug,
  initialItems,
}: {
  tripSlug: string;
  initialItems: OutfitItemDto[];
}) {
  const [items, setItems] = useState<OutfitItemDto[]>(initialItems);
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [rawItems, setRawItems] = useState("");
  const [notes, setNotes] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editRawItems, setEditRawItems] = useState("");
  const [editNotes, setEditNotes] = useState("");

  function add() {
    const t = title.trim();
    if (!t) return;
    const payload = {
      title: t,
      dayNumber: 1,
      items: parseItems(rawItems),
      notes: notes.trim(),
    };
    setTitle("");
    setRawItems("");
    setNotes("");

    startTransition(async () => {
      const res = await fetch(`/api/trips/${tripSlug}/outfits`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { item?: OutfitItemDto };
      if (json.item) setItems((prev) => [...prev, json.item!]);
    });
  }

  function beginEdit(o: OutfitItemDto) {
    setEditingId(o.id);
    setEditTitle(o.title);
    setEditRawItems(o.items.join(", "));
    setEditNotes(o.notes);
  }

  function saveEdit(id: string) {
    const t = editTitle.trim();
    if (!t) return;
    const payload = {
      title: t,
      dayNumber: 1,
      items: parseItems(editRawItems),
      notes: editNotes.trim(),
    };
    setEditingId(null);
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, ...payload } : x)),
    );
    startTransition(async () => {
      await fetch(`/api/trips/${tripSlug}/outfits/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
    });
  }

  function remove(id: string) {
    const snapshot = items;
    setItems((prev) => prev.filter((x) => x.id !== id));
    startTransition(async () => {
      const res = await fetch(`/api/trips/${tripSlug}/outfits/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) setItems(snapshot);
    });
  }

  return (
    <div className={styles.stack}>
      <div className={styles.panel}>
        <p className={styles.panel__title}>Outfits</p>
        <p className={styles.panel__text}>Plan what to wear for this trip.</p>

        <div className={styles.panel__form}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Outfit title (e.g. City walk)"
            className={styles.panel__input}
          />
          <input
            value={rawItems}
            onChange={(e) => setRawItems(e.target.value)}
            placeholder="Items (comma-separated)"
            className={styles.panel__input}
          />
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className={styles.panel__input}
          />
          <button
            className={styles.panel__button}
            type="button"
            onClick={add}
            disabled={pending}
          >
            Add
          </button>
        </div>
      </div>

      {items.length ? (
        <div className={styles.cardList}>
          <div className={styles.outfitGrid}>
            {items.map((o) => (
              <div key={o.id} className={styles.outfitCard}>
                {editingId === o.id ? (
                  <div className={styles.outfitCard__edit}>
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className={styles.itemCard__input}
                    />
                    <input
                      value={editRawItems}
                      onChange={(e) => setEditRawItems(e.target.value)}
                      className={styles.itemCard__input}
                    />
                    <input
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className={styles.itemCard__input}
                    />
                    <div className={styles.itemCard__actions}>
                      <button
                        type="button"
                        className={styles.linkButton}
                        onClick={() => saveEdit(o.id)}
                        disabled={pending}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className={styles.linkButton}
                        onClick={() => setEditingId(null)}
                        disabled={pending}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className={styles.outfitCard__title}>{o.title}</p>
                    <p className={styles.outfitCard__meta}>
                      {o.items.length ? o.items.join(" · ") : "—"}
                    </p>
                    {o.notes ? (
                      <p className={styles.outfitCard__meta}>{o.notes}</p>
                    ) : null}
                    <div className={styles.itemCard__actions}>
                      <button
                        type="button"
                        className={styles.linkButton}
                        onClick={() => beginEdit(o)}
                        disabled={pending}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={`${styles.linkButton} ${styles["linkButton--danger"]}`}
                        onClick={() => remove(o.id)}
                        disabled={pending}
                      >
                        Remove
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.panel}>
          <p className={styles.panel__text}>No outfits yet.</p>
        </div>
      )}
    </div>
  );
}

