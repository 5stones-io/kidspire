class ReplaceSupabaseUidWithAccountId < ActiveRecord::Migration[7.2]
  def change
    remove_index  :kidsmin_families, :supabase_uid
    remove_column :kidsmin_families, :supabase_uid, :string

    add_column      :kidsmin_families, :account_id, :bigint
    add_index       :kidsmin_families, :account_id, unique: true, where: "account_id IS NOT NULL"
    add_foreign_key :kidsmin_families, :accounts, column: :account_id, on_delete: :nullify
  end
end
