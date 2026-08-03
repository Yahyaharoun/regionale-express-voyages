-- 1. Ajouter la contrainte CHECK sur le montant des opérations
ALTER TABLE "Operation" ADD CONSTRAINT check_montant_positif CHECK (montant > 0);

-- 2. Ajouter la contrainte CHECK sur le montant des objectifs bancaires
ALTER TABLE "BankObjective" ADD CONSTRAINT check_montant_objectif_positif CHECK (montant > 0);
