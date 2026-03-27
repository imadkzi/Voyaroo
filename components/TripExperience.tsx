import Link from "next/link";
import { redirect } from "next/navigation";
import { ListChecks, MapPinned, Pencil, Shirt } from "lucide-react";
import type {
  ChecklistItem,
  ItineraryItem,
  OutfitItem,
  TripListItem,
} from "../lib/trips";
import { tripTabHref, type TripTabId } from "../lib/trip-tabs";
import { TripHeroPanel } from "./TripHeroPanel";
import { TripTabs } from "./TripTabs";
import { TripChecklist } from "./TripChecklist";
import { TripItinerary } from "./TripItinerary";
import { TripOutfits } from "./TripOutfits";
import hubStyles from "../styles/pages/TripHub.module.scss";
import subStyles from "../styles/pages/TripSubpage.module.scss";
import {
  listChecklistItems,
  listItineraryItems,
  listOutfitItems,
} from "../lib/trips";
import { auth } from "../lib/auth";
import { query } from "../lib/db/postgres";

const planSections = [
  {
    tab: "itinerary" as const,
    label: "Itinerary",
    description: "Day-by-day plan, places, and notes.",
    icon: MapPinned,
  },
  {
    tab: "checklist" as const,
    label: "Checklist",
    description: "Packing and pre-trip tasks.",
    icon: ListChecks,
  },
  {
    tab: "outfits" as const,
    label: "Outfits",
    description: "What to wear by day and activity.",
    icon: Shirt,
  },
] as const;

function chunkByDay(items: ItineraryItem[]) {
  const byDay = new Map<number, ItineraryItem[]>();
  items.forEach((it) => {
    const current = byDay.get(it.dayNumber) ?? [];
    current.push(it);
    byDay.set(it.dayNumber, current);
  });
  return Array.from(byDay.entries()).sort(([a], [b]) => a - b);
}

function buildNextUpItems({
  itinerary,
  checklist,
  outfits,
}: {
  itinerary: ItineraryItem[];
  checklist: ChecklistItem[];
  outfits: OutfitItem[];
}) {
  const itineraryDays = chunkByDay(itinerary).length;
  const checklistDone = checklist.filter((item) => item.done).length;
  const checklistOpen = checklist.length - checklistDone;
  const outfitPieces = outfits.reduce((acc, outfit) => acc + outfit.items.length, 0);

  const steps: string[] = [];
  if (!itinerary.length) {
    steps.push("Add your first itinerary stop");
  } else if (itineraryDays < 3) {
    steps.push(`Expand your plan beyond Day ${itineraryDays}`);
  }

  if (!checklist.length) {
    steps.push("Create your pre-trip checklist");
  } else if (checklistOpen > 0) {
    steps.push(`Complete ${checklistOpen} remaining checklist item(s)`);
  }

  if (!outfits.length) {
    steps.push("Add your first outfit plan");
  } else if (outfitPieces < 5) {
    steps.push("Add a few more outfit pieces for flexibility");
  }

  if (!steps.length) {
    steps.push("Trip plan is looking great - review and enjoy");
  }

  return steps;
}

function toDateTimeLocalValue(iso: string | null) {
  if (!iso) return "";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "";
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const hh = String(dt.getHours()).padStart(2, "0");
  const min = String(dt.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

async function TripTabBody({
  trip,
  tab,
}: {
  trip: TripListItem;
  tab: TripTabId;
}) {
  async function deleteTrip() {
    "use server";
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      redirect("/login");
    }
    await query(`delete from trips where id = $1 and owner_id = $2`, [
      trip.tripUuid,
      userId,
    ]);
    redirect("/");
  }

  async function updateTripDetails(formData: FormData) {
    "use server";
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      redirect("/login");
    }

    const title = String(formData.get("title") ?? "").trim();
    if (!title) return;

    const subtitle = String(formData.get("subtitle") ?? "").trim();
    const locationLabel = String(formData.get("locationLabel") ?? "").trim();
    const heroImageSrcRaw = String(formData.get("heroImageSrc") ?? "").trim();
    const departureAtRaw = String(formData.get("departureAt") ?? "").trim();

    const departureAt = departureAtRaw ? new Date(departureAtRaw) : null;
    if (departureAtRaw && (!departureAt || Number.isNaN(departureAt.getTime()))) {
      return;
    }

    const heroImageSrc =
      heroImageSrcRaw ||
      (locationLabel
        ? `https://picsum.photos/seed/${encodeURIComponent(
            locationLabel,
          )}/1600/900`
        : "");

    await query(
      `update trips
       set title = $1,
           subtitle = $2,
           location_label = $3,
           hero_image_src = $4,
           departure_at = $5
       where id = $6 and owner_id = $7`,
      [
        title,
        subtitle,
        locationLabel,
        heroImageSrc,
        departureAt,
        trip.tripUuid,
        userId,
      ],
    );

    redirect(`/trips/${trip.id}?tab=overview`);
  }

  switch (tab) {
    case "overview": {
      const [itinerary, checklist, outfits] = await Promise.all([
        listItineraryItems(trip.tripUuid),
        listChecklistItems(trip.tripUuid),
        listOutfitItems(trip.tripUuid),
      ]);
      const itineraryDays = chunkByDay(itinerary).length;
      const checklistDone = checklist.filter((item) => item.done).length;
      const nextUpItems = buildNextUpItems({ itinerary, checklist, outfits });
      const dynamicSections = planSections.map((section) => {
        if (section.tab === "itinerary") {
          return {
            ...section,
            description: itinerary.length
              ? `${itinerary.length} stop(s) across ${itineraryDays} day(s).`
              : "No plans yet - add your first day.",
          };
        }
        if (section.tab === "checklist") {
          return {
            ...section,
            description: checklist.length
              ? `${checklistDone}/${checklist.length} complete.`
              : "No checklist items yet.",
          };
        }
        return {
          ...section,
          description: outfits.length
            ? `${outfits.length} outfit plan(s) saved.`
            : "No outfit plans yet.",
        };
      });

      return (
        <>
          <section
            className={hubStyles.hub__section}
            aria-labelledby="hub-next-label"
          >
            <h2 id="hub-next-label" className={hubStyles.hub__sectionTitle}>
              Next up
            </h2>
            <ul className={hubStyles.hub__checklist}>
              {nextUpItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section
            className={hubStyles.hub__section}
            aria-labelledby="hub-plan-label"
          >
            <h2 id="hub-plan-label" className={hubStyles.hub__sectionTitle}>
              Plan this trip
            </h2>
            <div className={hubStyles.hub__grid}>
              {dynamicSections.map((s) => {
                const Icon = s.icon;
                return (
                  <Link
                    key={s.label}
                    href={tripTabHref(trip.id, s.tab)}
                    scroll={false}
                    className={hubStyles.hubCard}
                  >
                    <span className={hubStyles.hubCard__icon} aria-hidden>
                      <Icon className={hubStyles.hubCard__iconSvg} />
                    </span>
                    <span className={hubStyles.hubCard__label}>{s.label}</span>
                    <span className={hubStyles.hubCard__desc}>
                      {s.description}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section
            className={hubStyles.hub__section}
            aria-labelledby="hub-manage-label"
          >
            <details className={subStyles.menu}>
              <summary className={subStyles.menu__trigger}>
                <span className={subStyles.menu__triggerIcon} aria-hidden>
                  <Pencil size={14} />
                </span>
                Manage trip
              </summary>
              <div className={subStyles.menu__content}>
                <div className={subStyles.menu__group}>
                  <p className={subStyles.panel__text}>
                    Update title, destination, date, and hero image for this trip.
                  </p>
                  <form action={updateTripDetails} className={subStyles.panel__form}>
                    <input
                      name="title"
                      required
                      defaultValue={trip.title}
                      className={subStyles.panel__input}
                      placeholder="Trip title"
                    />
                    <input
                      name="subtitle"
                      defaultValue={trip.subtitle}
                      className={subStyles.panel__input}
                      placeholder="Subtitle"
                    />
                    <input
                      name="locationLabel"
                      defaultValue={trip.locationLabel}
                      className={subStyles.panel__input}
                      placeholder="Location (e.g. Barcelona, Spain)"
                    />
                    <input
                      name="departureAt"
                      type="datetime-local"
                      defaultValue={toDateTimeLocalValue(trip.departureAt)}
                      className={subStyles.panel__input}
                    />
                    <input
                      name="heroImageSrc"
                      defaultValue={trip.heroImageSrc}
                      className={subStyles.panel__input}
                      placeholder="Hero image URL"
                    />
                    <button type="submit" className={subStyles.panel__button}>
                      Save trip details
                    </button>
                  </form>
                </div>

                <div className={subStyles.menu__group}>
                  <p className={subStyles.panel__text}>
                    Delete this trip and all itinerary, checklist, and outfit items.
                  </p>
                  <form action={deleteTrip} className={subStyles.panel__form}>
                    <button
                      type="submit"
                      className={`${subStyles.panel__button} ${subStyles["panel__button--subtleDanger"]}`}
                    >
                      Delete trip permanently
                    </button>
                  </form>
                </div>
              </div>
            </details>
          </section>
        </>
      );
    }

    case "itinerary":
      const itinerary = await listItineraryItems(trip.tripUuid);
      return <TripItinerary tripSlug={trip.id} initialItems={itinerary} />;

    case "checklist":
      const checklist = await listChecklistItems(trip.tripUuid);
      return <TripChecklist tripSlug={trip.id} initialItems={checklist} />;

    case "outfits":
      const outfits = await listOutfitItems(trip.tripUuid);
      return <TripOutfits tripSlug={trip.id} initialItems={outfits} />;

    default:
      return null;
  }
}

export function TripExperience({
  trip,
  tab,
}: {
  trip: TripListItem;
  tab: TripTabId;
}) {
  return (
    <div className={hubStyles.hub}>
      <div className={hubStyles.hub__heroWrap}>
        <TripHeroPanel trip={trip} imagePriority headingTag="h2" rounded />
      </div>

      <p className={hubStyles.hub__meta}>{trip.subtitle}</p>
      <p className={hubStyles.hub__location}>{trip.locationLabel}</p>

      <TripTabs tripId={trip.id} activeTab={tab} />

      <TripTabBody trip={trip} tab={tab} />
    </div>
  );
}
