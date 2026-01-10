-- Atomically record a stock movement and update inventory quantity
-- This is SECURITY DEFINER so employees can record entrada/saida without direct UPDATE access to inventory_items.

CREATE OR REPLACE FUNCTION public.record_stock_movement(
  _item_id uuid,
  _movement_type public.movement_type,
  _quantity numeric,
  _notes text DEFAULT NULL
)
RETURNS public.stock_movements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_current_qty numeric;
  v_new_qty numeric;
  v_movement public.stock_movements;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  IF _quantity IS NULL OR _quantity <= 0 THEN
    RAISE EXCEPTION 'Quantidade inválida';
  END IF;

  -- Lock the inventory row to avoid race conditions
  SELECT quantity
    INTO v_current_qty
  FROM public.inventory_items
  WHERE id = _item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item não encontrado';
  END IF;

  IF _movement_type = 'entrada' THEN
    v_new_qty := COALESCE(v_current_qty, 0) + _quantity;
  ELSIF _movement_type = 'saida' THEN
    v_new_qty := COALESCE(v_current_qty, 0) - _quantity;
    IF v_new_qty < 0 THEN
      RAISE EXCEPTION 'Estoque insuficiente';
    END IF;
  ELSE
    RAISE EXCEPTION 'Tipo de movimentação inválido';
  END IF;

  UPDATE public.inventory_items
  SET quantity = v_new_qty,
      updated_at = now()
  WHERE id = _item_id;

  INSERT INTO public.stock_movements (item_id, user_id, movement_type, quantity, notes)
  VALUES (_item_id, v_user_id, _movement_type, _quantity, _notes)
  RETURNING * INTO v_movement;

  RETURN v_movement;
END;
$$;

REVOKE ALL ON FUNCTION public.record_stock_movement(uuid, public.movement_type, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_stock_movement(uuid, public.movement_type, numeric, text) TO authenticated;
