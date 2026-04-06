/**
 * Єдині відступи та лінії таймлайну / картки задачі (день + списки).
 * .js — гарантоване резолвлення Metro з `DayTimeline.jsx`.
 */
export const TIMELINE_HORIZONTAL_RHYTHM_PX = 8;

/**
 * Товщина ліній осі (як у Figma Stroke weight 1 — не «жирно»).
 */
export const TIMELINE_RAIL_STROKE_WIDTH_PX = 1;
/** Цілі пікселі для View/border (фонова смуга, розділювач каруселі). */
export const TIMELINE_RAIL_VIEW_LINE_PX = Math.max(1, Math.ceil(TIMELINE_RAIL_STROKE_WIDTH_PX));

/** Зворотна сумісність імені — те саме, що STROKE_WIDTH для розмітки. */
export const TIMELINE_RAIL_WIDTH_PX = TIMELINE_RAIL_STROKE_WIDTH_PX;

/** Ширина зони підпису години (:00); мінімум під «12:00» при 12px. */
export const TIMELINE_HOUR_LABEL_WIDTH_PX = 38;
/** Відступ між текстом часу й лінією (менше — ближче до часу). */
export const TIMELINE_RAIL_SIDE_GUTTER_PX = 2;

/** Лівий край лінії (px від лівого краю рядка контенту таймлайну). */
export const TIMELINE_RAIL_LINE_LEFT_PX =
  TIMELINE_HOUR_LABEL_WIDTH_PX + TIMELINE_RAIL_SIDE_GUTTER_PX;

/** Центр вертикальної рельси (підпис години центрується на цій осі). */
export const TIMELINE_RAIL_CENTER_X_PX =
  TIMELINE_RAIL_LINE_LEFT_PX + TIMELINE_RAIL_STROKE_WIDTH_PX / 2;

/**
 * Ширина колонки шкали до flex-колонки карток: підпис може заходити ліворуч/праворуч від лінії,
 * тому ширина ≥ центр рельси + півширини підпису + правий gutter.
 */
export const TIMELINE_SCALE_COLUMN_WIDTH_PX = Math.ceil(
  TIMELINE_RAIL_CENTER_X_PX +
    TIMELINE_HOUR_LABEL_WIDTH_PX / 2 +
    TIMELINE_RAIL_SIDE_GUTTER_PX,
);

/** Текст шкали в списках (трохи світліший за лінію). */
export const TIMELINE_RAIL_STROKE = '#898989';
/** Усі лінії осі / з’єднувачі — один колір. */
export const TIMELINE_RAIL_AXIS_STROKE = '#6E6E6E';

/** Горизонталь «зараз» від пігулки — як у Figma (коричневий пунктир, не сіра вісь). */
export const TIMELINE_NOW_HORIZ_STROKE = '#452C16';
export const TIMELINE_NOW_HORIZ_OPACITY = 0.7;
export const TIMELINE_NOW_HORIZ_DASH_ARRAY = '12 6';

/** Зона від центру рельси до колонки карток (лінія до задачі в списку). */
export const TIMELINE_TASK_CONNECTOR_GAP_PX = Math.ceil(
  TIMELINE_SCALE_COLUMN_WIDTH_PX - TIMELINE_RAIL_CENTER_X_PX,
);

export const TASK_STRIP_PILL_WIDTH_PX = 8;
export const TASK_STRIP_PILL_RADIUS_PX = TASK_STRIP_PILL_WIDTH_PX / 2;

/**
 * Колонка під кольорову смужку = ширина самої смужки (без «мертвого» поля справа в колонці).
 */
export const TASK_STRIP_COLUMN_WIDTH_PX = TASK_STRIP_PILL_WIDTH_PX;

/**
 * Один відступ з обох боків кольорової смужки в картці: до неї і після неї до тексту (= горизонтальний ритм).
 */
export const TASK_CARD_STRIP_SIDE_INSET_PX = TIMELINE_HORIZONTAL_RHYTHM_PX;

export const TASK_CARD_INNER_PADDING_LEFT_PX = TASK_CARD_STRIP_SIDE_INSET_PX;
export const TASK_CARD_STRIP_TO_TEXT_GAP_PX = TASK_CARD_STRIP_SIDE_INSET_PX;

export const TASK_CARD_TEXT_INSET_FROM_CARD_LEFT_PX =
  TASK_CARD_INNER_PADDING_LEFT_PX +
  TASK_STRIP_COLUMN_WIDTH_PX +
  TASK_CARD_STRIP_TO_TEXT_GAP_PX;

export const OVERLAP_COLUMN_GUTTER_PX = TIMELINE_HORIZONTAL_RHYTHM_PX;

export const TASK_CHECKBOX_HIT_W_PX = 28;
export const TASK_CARD_BODY_PADDING_RIGHT_PX =
  TASK_CHECKBOX_HIT_W_PX + TIMELINE_HORIZONTAL_RHYTHM_PX * 2;
export const TASK_CHECK_BTN_RIGHT_PX = TIMELINE_HORIZONTAL_RHYTHM_PX;
