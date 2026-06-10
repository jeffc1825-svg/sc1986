-- ============================================================
-- 0002 巢狀分類強化
-- 1) 父分類刪除保護:有子分類就不可刪(避免子分類意外變頂層)
-- 2) 深度上限 4 層 + 防循環(BEFORE INSERT/UPDATE trigger)
-- 設計原則:維持 adjacency list(parent_id),不引入 path/closure 表,
-- 樹狀組合與子孫查詢由應用層(小表全量 + 快取)處理,維護成本最低。
-- ============================================================

-- 原 FK 為 on delete set null,改為 restrict
alter table categories drop constraint categories_parent_id_fkey;
alter table categories
  add constraint categories_parent_id_fkey
  foreign key (parent_id) references categories(id) on delete restrict;

-- 深度與循環檢查:最深 4 層(1 = 頂層)。
-- 與 src/types/domain.ts 的 CATEGORY_MAX_DEPTH 同步,修改其一必須同步另一處。
create or replace function check_category_depth()
returns trigger
language plpgsql
as $$
declare
  v_max constant integer := 4;
  v_depth integer := 1;
  v_height integer;
  v_cursor uuid := new.parent_id;
begin
  if new.parent_id = new.id then
    raise exception '分類不可指定自己為父分類';
  end if;

  -- 沿祖先往上:計算深度,同時偵測循環
  while v_cursor is not null loop
    if v_cursor = new.id then
      raise exception '分類結構不可形成循環';
    end if;
    v_depth := v_depth + 1;
    if v_depth > v_max then
      raise exception '分類深度不可超過 % 層', v_max;
    end if;
    select parent_id into v_cursor from categories where id = v_cursor;
  end loop;

  -- 搬移既有節點時,其子樹高度也不可使任何子孫超過上限
  -- (INSERT 時資料列尚未入表,子樹高度為 1,等同單純深度檢查)
  with recursive sub as (
    select id, 1 as h from categories where id = new.id
    union all
    select c.id, sub.h + 1 from categories c join sub on c.parent_id = sub.id
  )
  select coalesce(max(h), 1) into v_height from sub;

  if v_depth + v_height - 1 > v_max then
    raise exception '此變更會使子孫分類超過 % 層深度上限', v_max;
  end if;

  return new;
end;
$$;

create trigger trg_categories_depth
  before insert or update of parent_id on categories
  for each row execute function check_category_depth();
