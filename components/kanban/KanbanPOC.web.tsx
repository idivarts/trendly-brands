import React, { useMemo, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  pointerWithin,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * -----------------------------
 * POC TYPES (minimal, no styling)
 * -----------------------------
 */

type CRMColumnId =
  | "new_leads"
  | "in_progress_leads"
  | "active_leads"
  | "churned_leads";

type Card = {
  id: string;
  title: string;
  crmStatus: CRMColumnId;
};

type Column = {
  id: CRMColumnId;
  title: string;
  cards: Card[];
};

/**
 * -----------------------------
 * PURE KANBAN LOGIC (POC)
 * -----------------------------
 */

function moveCardBetweenColumns(
  state: Column[],
  cardId: string,
  fromColumnId: CRMColumnId,
  toColumnId: CRMColumnId,
  toIndex?: number
): Column[] {
  if (fromColumnId === toColumnId) return state;

  let movingCard: Card | null = null;

  const intermediate = state.map((col) => {
    if (col.id === fromColumnId) {
      return {
        ...col,
        cards: col.cards.filter((c) => {
          if (c.id === cardId) {
            movingCard = c;
            return false;
          }
          return true;
        }),
      };
    }
    return col;
  });

  if (!movingCard) return state;

  return intermediate.map((col) => {
    if (col.id === toColumnId) {
      const cards = [...col.cards];
      const index =
        typeof toIndex === "number" ? toIndex : cards.length;

      cards.splice(index, 0, {
        ...movingCard,
        crmStatus: toColumnId,
      });

      return { ...col, cards };
    }
    return col;
  });
}

/**
 * -----------------------------
 * INITIAL DATA (POC)
 * -----------------------------
 */

const INITIAL_COLUMNS: Column[] = [
  {
    id: "new_leads",
    title: "New Leads",
    cards: [
      { id: "1", title: "Brand A", crmStatus: "new_leads" },
      { id: "2", title: "Brand B", crmStatus: "new_leads" },
    ],
  },
  {
    id: "in_progress_leads",
    title: "In Progress",
    cards: [{ id: "3", title: "Brand C", crmStatus: "in_progress_leads" }],
  },
  {
    id: "active_leads",
    title: "Active",
    cards: [],
  },
  {
    id: "churned_leads",
    title: "Churned",
    cards: [],
  },
];

/**
 * -----------------------------
 * POC SCREEN
 * -----------------------------
 */

export default function KanbanPOC() {
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const handleDragStart = (event: any) => {
    const activeId = event.active.id as string;
    const [, cardId] = activeId.split(":");

    const card =
      columns.flatMap((c) => c.cards).find((c) => c.id === cardId) || null;

    setActiveCard(card);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const [fromColumnId, cardId] = activeId.split(":");

    // CASE 1: dropped on empty column
    if (!overId.includes(":")) {
      setColumns((prev) =>
        moveCardBetweenColumns(
          prev,
          cardId,
          fromColumnId as CRMColumnId,
          overId as CRMColumnId
        )
      );
      setActiveCard(null);
      return;
    }

    // CASE 2: dropped on another card
    const [toColumnId, overCardId] = overId.split(":");

    setColumns((prev) => {
      const targetColumn = prev.find((c) => c.id === toColumnId);
      if (!targetColumn) return prev;

      const toIndex = targetColumn.cards.findIndex(
        (c) => c.id === overCardId
      );

      return moveCardBetweenColumns(
        prev,
        cardId,
        fromColumnId as CRMColumnId,
        toColumnId as CRMColumnId,
        toIndex
      );
    });
    setActiveCard(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <DragOverlay>
        {activeCard ? (
          <View
            style={{
              padding: 12,
              borderWidth: 1,
              borderRadius: 6,
              backgroundColor: "#fff",
              boxShadow: "0px 8px 24px rgba(0,0,0,0.15)",
              width: 180,
              opacity: 0.95,
            }}
          >
            <Text>{activeCard.title}</Text>
          </View>
        ) : null}
      </DragOverlay>
      <ScrollView horizontal>
        <View style={{ flexDirection: "row", padding: 16 }}>
          {columns.map((column) => (
            <POCColumn key={column.id} column={column} />
          ))}
        </View>
      </ScrollView>
    </DndContext>
  );
}

/**
 * -----------------------------
 * COLUMN (POC)
 * -----------------------------
 */

function POCColumn({ column }: { column: Column }) {
  const { setNodeRef } = useDroppable({ id: column.id });

  const items = useMemo(
    () => column.cards.map((c) => `${column.id}:${c.id}`),
    [column.cards, column.id]
  );

  return (
    <View ref={setNodeRef as any} style={{ width: 220, marginRight: 16 }}>
      <Text style={{ fontWeight: "700", marginBottom: 8 }}>
        {column.title}
      </Text>

      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {column.cards.map((card) => (
          <POCCard
            key={card.id}
            id={`${column.id}:${card.id}`}
            title={card.title}
          />
        ))}
      </SortableContext>

      {column.cards.length === 0 && (
        <Text style={{ opacity: 0.5 }}>Drop here</Text>
      )}
    </View>
  );
}

/**
 * -----------------------------
 * CARD (POC)
 * -----------------------------
 */

function POCCard({ id, title }: { id: string; title: string }) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isOver,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
    backgroundColor: "#fff",
  };

  // remove web-only a11y props for RN
  const { role, tabIndex, ...rest } = attributes as any;

  return (
    <View
      ref={setNodeRef as any}
      {...rest}
      {...listeners}
      style={[
        style,
        { touchAction: "none", position: "relative" },
      ]}
    >
      {isOver && (
        <View
          style={{
            position: "absolute",
            top: -4,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: "#2563EB",
            borderRadius: 2,
          }}
        />
      )}
      <Text>{title}</Text>
    </View>
  );
}
