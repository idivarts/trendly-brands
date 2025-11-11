import React, { useEffect, useState } from "react";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
  closestCenter,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Keyboard,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";

export type KanbanCardT = {
  id: string;
  title: string;
  description?: string;
};

export type KanbanColumnT = {
  id: string;
  title: string;
  cards: KanbanCardT[];
};

const STORAGE_KEY = "trendly-kanban-v3";
const generateId = () =>
  "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);

export default function KanbanBoard() {
  const [columns, setColumns] = useState<KanbanColumnT[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState<string>("");

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        setColumns(JSON.parse(raw));
      } else {
        setColumns([
          { id: "todo", title: "To Do", cards: [] },
          { id: "doing", title: "In Progress", cards: [] },
          { id: "done", title: "Done", cards: [] },
        ]);
      }
    })();
  }, []);

  const persist = async (next: KanbanColumnT[]) => {
    setColumns(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const [fromColumnId, fromCardId] = (active.id as string).split(":");
    const [toColumnId, toCardId] = (over.id as string).split(":");

    if (fromColumnId === toColumnId) {
      const col = columns.find((c) => c.id === fromColumnId);
      if (!col) return;
      const oldIndex = col.cards.findIndex((c) => c.id === fromCardId);
      const newIndex = col.cards.findIndex((c) => c.id === toCardId);
      if (oldIndex === -1 || newIndex === -1) return;
      const updated = columns.map((c) =>
        c.id === col.id
          ? { ...c, cards: arrayMove(c.cards, oldIndex, newIndex) }
          : c
      );
      persist(updated);
    } else {
      const from = columns.find((c) => c.id === fromColumnId);
      const to = columns.find((c) => c.id === toColumnId);
      if (!from || !to) return;
      const card = from.cards.find((c) => c.id === fromCardId);
      if (!card) return;

      const fromCards = from.cards.filter((c) => c.id !== fromCardId);
      const insertAt =
        toCardId && to.cards.findIndex((c) => c.id === toCardId) + 1;
      const toCards = [
        ...to.cards.slice(0, insertAt || to.cards.length),
        card,
        ...to.cards.slice(insertAt || to.cards.length),
      ];

      const updated = columns.map((c) =>
        c.id === from.id
          ? { ...c, cards: fromCards }
          : c.id === to.id
          ? { ...c, cards: toCards }
          : c
      );
      persist(updated);
    }
    setActiveId(null);
  };

  const addCard = (colId: string) => {
    const newCard = { id: generateId(), title: "", description: "" };
    persist(
      columns.map((c) =>
        c.id === colId ? { ...c, cards: [...c.cards, newCard] } : c
      )
    );
  };

  const deleteCard = (colId: string, cardId: string) => {
    persist(
      columns.map((c) =>
        c.id === colId
          ? { ...c, cards: c.cards.filter((x) => x.id !== cardId) }
          : c
      )
    );
  };

  const addColumn = () => {
    const newColumn = { id: generateId(), title: "New Column", cards: [] };
    persist([...columns, newColumn]);
  };

  const deleteColumn = (colId: string) => {
    if (!window.confirm("Delete this column?")) return;
    persist(columns.filter((c) => c.id !== colId));
  };

  const startEditingColumn = (colId: string, currentTitle: string) => {
    setEditingColumnId(colId);
    setEditingColumnTitle(currentTitle);
  };

  const finishEditingColumn = () => {
    if (editingColumnId === null) return;
    const trimmedTitle = editingColumnTitle.trim();
    if (trimmedTitle.length === 0) {
      // If title is empty, revert to previous title by not saving
      setEditingColumnId(null);
      setEditingColumnTitle("");
      return;
    }
    const updated = columns.map((col) =>
      col.id === editingColumnId ? { ...col, title: trimmedTitle } : col
    );
    persist(updated);
    setEditingColumnId(null);
    setEditingColumnTitle("");
  };

  const handleColumnTitleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>
  ) => {
    if (e.nativeEvent.key === "Enter") {
      Keyboard.dismiss();
      finishEditingColumn();
    }
  };

  const updateCardField = (
    colId: string,
    cardId: string,
    field: "title" | "description",
    value: string
  ) => {
    const updated = columns.map((col) =>
      col.id === colId
        ? {
            ...col,
            cards: col.cards.map((card) =>
              card.id === cardId ? { ...card, [field]: value } : card
            ),
          }
        : col
    );
    persist(updated);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trendly Admin Invites</Text>
        <Pressable onPress={addColumn} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Column</Text>
        </Pressable>
      </View>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <View style={styles.row}>
          {columns.map((col) => (
            <DroppableColumn
              key={col.id}
              column={col}
              onAddCard={() => addCard(col.id)}
              onDeleteColumn={() => deleteColumn(col.id)}
              onDeleteCard={deleteCard}
              onUpdateCard={updateCardField}
              editingColumnId={editingColumnId}
              editingColumnTitle={editingColumnTitle}
              onStartEditingColumn={() => startEditingColumn(col.id, col.title)}
              onChangeEditingColumnTitle={setEditingColumnTitle}
              onFinishEditingColumn={finishEditingColumn}
              onColumnTitleKeyPress={handleColumnTitleKeyPress}
            />
          ))}
        </View>
      </DndContext>
    </View>
  );
}

const DroppableColumn = ({
  column,
  onAddCard,
  onDeleteColumn,
  onDeleteCard,
  onUpdateCard,
  editingColumnId,
  editingColumnTitle,
  onStartEditingColumn,
  onChangeEditingColumnTitle,
  onFinishEditingColumn,
  onColumnTitleKeyPress,
}: {
  column: KanbanColumnT;
  onAddCard: () => void;
  onDeleteColumn: () => void;
  onDeleteCard: (colId: string, cardId: string) => void;
  onUpdateCard: (
    colId: string,
    cardId: string,
    field: "title" | "description",
    value: string
  ) => void;
  editingColumnId: string | null;
  editingColumnTitle: string;
  onStartEditingColumn: () => void;
  onChangeEditingColumnTitle: (text: string) => void;
  onFinishEditingColumn: () => void;
  onColumnTitleKeyPress: (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const bgColor = isOver ? "#E0E7FF" : "#FFF";

  return (
    <View
      ref={setNodeRef as any}
      style={[styles.column, { backgroundColor: bgColor }]}
    >
      <View style={styles.columnHeader}>
        <View style={{ flexDirection: "row", flexShrink: 1, flexWrap: "nowrap", alignItems: "center" }}>
          {editingColumnId === column.id ? (
            <TextInput
              style={[styles.columnTitle, { flex: 1, maxWidth: "60%", borderBottomWidth: 1, borderColor: "#2563EB" }]}
              value={editingColumnTitle}
              onChangeText={onChangeEditingColumnTitle}
              onBlur={onFinishEditingColumn}
              onKeyPress={onColumnTitleKeyPress}
              autoFocus
              returnKeyType="done"
            />
          ) : (
            <Text style={[styles.columnTitle, { maxWidth: "60%" }]} numberOfLines={1} ellipsizeMode="tail">{column.title}</Text>
          )}
          {!editingColumnId && (
            <Pressable onPress={onStartEditingColumn} style={{ marginLeft: 8 }}>
              <Text style={{ color: "#2563EB" }}>Edit</Text>
            </Pressable>
          )}
          <View style={{ flexDirection: "row", gap: 8, marginLeft: 8 }}>
            <Pressable onPress={onAddCard}>
              <Text>+ Card</Text>
            </Pressable>
            <Pressable onPress={onDeleteColumn}>
              <Text style={{ color: "#C33" }}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <SortableContext
        items={column.cards.map((c) => `${column.id}:${c.id}`)}
        strategy={rectSortingStrategy}
      >
        {column.cards.map((card) => (
          <SortableCard
            key={card.id}
            id={`${column.id}:${card.id}`}
            card={card}
            colId={column.id}
            onDelete={() => onDeleteCard(column.id, card.id)}
            onUpdate={(field, value) => onUpdateCard(column.id, card.id, field, value)}
          />
        ))}
      </SortableContext>

      {column.cards.length === 0 && (
        <Text style={{ textAlign: "center", opacity: 0.6 }}>
          Drop here to move card
        </Text>
      )}
    </View>
  );
};

const SortableCard = ({
  id,
  card,
  colId,
  onDelete,
  onUpdate,
}: {
  id: string;
  card: KanbanCardT;
  colId: string;
  onDelete: () => void;
  onUpdate: (field: "title" | "description", value: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <View
      ref={setNodeRef as any}
      {...attributes}
      {...listeners}
      style={[
        styles.card,
        style,
        {
          display: "flex",
          flexDirection: "column",
          marginBottom: 8,
        },
      ]}
    >
      <TextInput
        style={styles.cardTitle}
        value={card.title}
        onChangeText={(text) => onUpdate("title", text)}
        placeholder="Card title"
        returnKeyType="done"
        blurOnSubmit={true}
      />
      <TextInput
        style={[styles.cardDesc, { minHeight: 30, maxHeight: 120, textAlignVertical: "top", padding: 0 }]}
        value={card.description}
        onChangeText={(text) => onUpdate("description", text)}
        placeholder="Description"
        multiline
        returnKeyType="done"
        blurOnSubmit={true}
        scrollEnabled
      />
      <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
        <Pressable onPress={onDelete}>
          <Text style={{ color: "#C33" }}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: "700" },
  addBtn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: { color: "#FFF", fontWeight: "700" },
  row: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
    flexWrap: "nowrap",
    // overflowX: "auto",
  },
  column: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    width: 280,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  columnHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    paddingBottom: 8,
    marginBottom: 8,
  },
  columnTitle: { fontSize: 16, fontWeight: "700" },
  card: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: "600",
    borderBottomWidth: 1,
    borderColor: "#D1D5DB",
    paddingBottom: 4,
    marginBottom: 4,
  },
  cardDesc: {
    marginTop: 0,
    color: "#4B5563",
  },
});
