
-- Create expense_category enum
CREATE TYPE public.expense_category AS ENUM ('Fish', 'Meat', 'Vegetables', 'Rent', 'Gas', 'Others');

-- Create expenses table
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id uuid NOT NULL REFERENCES public.messes(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  category expense_category NOT NULL DEFAULT 'Others',
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  added_by uuid REFERENCES auth.users(id),
  added_by_name text,
  receipt_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS: View expenses in own mess
CREATE POLICY "Users can view expenses in their mess"
ON public.expenses FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR mess_id = get_user_mess_id(auth.uid())
);

-- RLS: Admins/moderators can insert
CREATE POLICY "Admins can insert expenses"
ON public.expenses FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
    AND mess_id = get_user_mess_id(auth.uid())
  )
);

-- RLS: Admins/moderators can update
CREATE POLICY "Admins can update expenses"
ON public.expenses FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
    AND mess_id = get_user_mess_id(auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
    AND mess_id = get_user_mess_id(auth.uid())
  )
);

-- RLS: Admins/moderators can delete
CREATE POLICY "Admins can delete expenses"
ON public.expenses FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
    AND mess_id = get_user_mess_id(auth.uid())
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;

-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for receipts bucket
CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Anyone can view receipts"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'receipts');

CREATE POLICY "Admins can delete receipts"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'receipts');
