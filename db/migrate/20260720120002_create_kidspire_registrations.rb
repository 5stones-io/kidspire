class CreateKidspireRegistrations < ActiveRecord::Migration[7.2]
  def change
    create_table :kidspire_registrations do |t|
      t.bigint   :family_id, null: false
      t.bigint   :event_id, null: false
      t.bigint   :child_id, null: false
      t.boolean  :synced_to_pco, default: false, null: false
      t.datetime :pco_synced_at
      t.timestamps
    end

    add_index :kidspire_registrations, :family_id
    add_index :kidspire_registrations, :event_id
    add_index :kidspire_registrations, :child_id
    add_index :kidspire_registrations, [:child_id, :event_id], unique: true

    add_foreign_key :kidspire_registrations, :spirely_families, column: :family_id
    add_foreign_key :kidspire_registrations, :spirely_children, column: :child_id
    add_foreign_key :kidspire_registrations, :kidspire_events, column: :event_id
  end
end
