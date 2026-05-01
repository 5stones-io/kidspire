class CreateKidspireFamilies < ActiveRecord::Migration[7.2]
  def change
    create_table :kidspire_families do |t|
      t.string   :supabase_uid,           null: false
      t.string   :family_name
      t.string   :primary_contact_name
      t.string   :email
      t.string   :phone
      t.string   :pco_person_id
      t.string   :pco_household_id
      t.boolean  :pco_sync_enabled,       null: false, default: true
      t.datetime :pco_last_synced_at

      t.timestamps
    end

    add_index :kidspire_families, :supabase_uid, unique: true
    add_index :kidspire_families, :email
    add_index :kidspire_families, :pco_person_id
    add_index :kidspire_families, :pco_household_id
  end
end
