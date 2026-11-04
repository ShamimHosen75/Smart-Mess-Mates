-- Saved meal calculator scenarios
CREATE TABLE public.meal_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID NOT NULL,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  month DATE NOT NULL,
  breakfast_count NUMERIC NOT NULL DEFAULT 0,
  lunch_count NUMERIC NOT NULL DEFAULT 0,
  dinner_count NUMERIC NOT NULL DEFAULT 0,
  breakfast_multiplier NUMERIC NOT NULL DEFAULT 0.5,
  lunch_multiplier NUMERIC NOT NULL DEFAULT 1,
  dinner_multiplier NUMERIC NOT NULL DEFAULT 1,
  custom_meals JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_expenses JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_meals NUMERIC NOT NULL DEFAULT 0,
  total_expense NUMERIC NOT NULL DEFAULT 0,
  per_meal_cost NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_meal_calculations_mess_month ON public.meal_calculations(mess_id, month DESC);
CREATE INDEX idx_meal_calculations_user ON public.meal_calculations(user_id);

ALTER TABLE public.meal_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view calculations in their mess"
ON public.meal_calculations FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR mess_id = get_user_mess_id(auth.uid()));

CREATE POLICY "Users can insert their own calculations"
ON public.meal_calculations FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id AND (
    has_role(auth.uid(), 'super_admin'::app_role) OR mess_id = get_user_mess_id(auth.uid())
  )
);

CREATE POLICY "Users can update their own calculations"
ON public.meal_calculations FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can delete their own calculations"
ON public.meal_calculations FOR DELETE TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_meal_calculations_updated_at
BEFORE UPDATE ON public.meal_calculations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();