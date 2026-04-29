class CreateKidsminRegistrations < ActiveRecord::Migration[7.2]
  def change
    create_table :kidsmin_registrations do |t|
      t.references :family, null: false,
                             foreign_key: { to_table: :kidsmin_families },
                             index: true
      t.references :event,  null: false,
                             foreign_key: { to_table: :kidsmin_events },
                             index: true
      t.references :child,  null: false,
                             foreign_key: { to_table: :kidsmin_children },
                             index: true
      t.boolean  :synced_to_pco, null: false, default: false
      t.datetime :pco_synced_at

      t.timestamps
    end

    # a child can only be registered once per event
    add_index :kidsmin_registrations, [:child_id, :event_id], unique: true
  end
end
