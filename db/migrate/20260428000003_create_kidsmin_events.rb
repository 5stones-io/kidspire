class CreateKidsminEvents < ActiveRecord::Migration[7.2]
  def change
    create_table :kidsmin_events do |t|
      t.string   :title,       null: false
      t.text     :description
      t.datetime :event_date,  null: false
      t.integer  :age_min
      t.integer  :age_max
      t.integer  :capacity
      t.string   :pco_event_id
      t.string   :pco_source   # "calendar" | "check_ins"
      t.datetime :pco_last_synced_at

      t.timestamps
    end

    add_index :kidsmin_events, :event_date
    add_index :kidsmin_events, :pco_event_id, unique: true, where: "pco_event_id IS NOT NULL"
  end
end
