"use client";

import { useMemo, useState, useTransition } from "react";
import styles from "../styles/pages/TripSubpage.module.scss";

export type ItineraryItemDto = {
  id: string;
  dayNumber: number;
  title: string;
  notes: string;
};

export function TripItinerary({
  tripSlug,
  initialItems,
}: {
  tripSlug: string;
  initialItems: ItineraryItemDto[];
}) {
  const [items, setItems] = useState<ItineraryItemDto[]>(initialItems);
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [dayNumber, setDayNumber] = useState(() => {
    const max = initialItems.reduce((acc, it) => Math.max(acc, it.dayNumber), 0);
    return Math.max(1, max + 1);
  });
  const [notes, setNotes] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDay, setEditDay] = useState(1);
  const [editNotes, setEditNotes] = useState("");

  const grouped = useMemo(() => {
    const byDay = new Map<number, ItineraryItemDto[]>();
    items.forEach((it) => {
      const arr = byDay.get(it.dayNumber) ?? [];
      arr.push(it);
      byDay.set(it.dayNumber, arr);
    });
    return Array.from(byDay.entries()).sort(([a], [b]) => a - b);
  }, [items]);

  function add() {
    const t = title.trim();
    if (!t) return;
    const payload = { title: t, dayNumber, notes: notes.trim() };
    setTitle("");
    setNotes("");

    startTransition(async () => {
      const res = await fetch(`/api/trips/${tripSlug}/itinerary`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setTitle(t);
        setNotes(notes);
        console.error("itinerary_add_failed", { tripSlug, status: res.status });
        return;
      }
      const json = (await res.json()) as { item?: ItineraryItemDto };
      if (json.item) {
        setItems((prev) => [...prev, json.item!]);
        // Default the next add to the next day for quick day-by-day entry.
        setDayNumber((d) => d + 1);
      }
    });
  }

  function beginEdit(it: ItineraryItemDto) {
    setEditingId(it.id);
    setEditTitle(it.title);
    setEditDay(it.dayNumber);
    setEditNotes(it.notes);
  }

  function saveEdit(id: string) {
    const t = editTitle.trim();
    if (!t) return;
    const payload = { title: t, dayNumber: editDay, notes: editNotes.trim() };
    const snapshot = items;
    setEditingId(null);
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...payload } : x)));
    startTransition(async () => {
      const res = await fetch(`/api/trips/${tripSlug}/itinerary/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setItems(snapshot);
        console.error("itinerary_edit_failed", { tripSlug, itemId: id, status: res.status });
      }
    });
  }

  function remove(id: string) {
    const snapshot = items;
    setItems((prev) => prev.filter((x) => x.id !== id));
    startTransition(async () => {
      const res = await fetch(`/api/trips/${tripSlug}/itinerary/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setItems(snapshot);
        console.error("itinerary_remove_failed", {
          tripSlug,
          itemId: id,
          status: res.status,
        });
      }
    });
  }

  return (
    <div className={styles.stack}>
      <div className={styles.panel}>
        <p className={styles.panel__title}>Itinerary</p>
        <p className={styles.panel__text}>Add day-by-day items for this trip.</p>

        <div className={styles.panel__form}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What’s happening?"
            className={styles.panel__input}
          />
          <input
            value={dayNumber}
            onChange={(e) => setDayNumber(Number(e.target.value || 1))}
            type="number"
            min={1}
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
          {grouped.map(([day, dayItems]) => (
            <div key={day} className={styles.dayGroup}>
              <p className={styles.dayGroup__title}>Day {day}</p>
              <div className={styles.itineraryList}>
                {dayItems.map((it) => (
                  <div key={it.id} className={styles.itineraryCard}>
                    {editingId === it.id ? (
                      <div className={styles.itineraryCard__edit}>
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className={styles.itemCard__input}
                        />
                        <input
                          value={editDay}
                          onChange={(e) => setEditDay(Number(e.target.value || 1))}
                          type="number"
                          min={1}
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
                            onClick={() => saveEdit(it.id)}
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
                        <p className={styles.itineraryCard__title}>{it.title}</p>
                        {it.notes ? (
                          <p className={styles.itineraryCard__notes}>{it.notes}</p>
                        ) : null}
                        <div className={styles.itemCard__actions}>
                          <button
                            type="button"
                            className={styles.linkButton}
                            onClick={() => beginEdit(it)}
                            disabled={pending}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className={`${styles.linkButton} ${styles["linkButton--danger"]}`}
                            onClick={() => remove(it.id)}
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
          ))}
        </div>
      ) : (
        <div className={styles.panel}>
          <p className={styles.panel__text}>No itinerary items yet.</p>
        </div>
      )}
    </div>
  );
}

