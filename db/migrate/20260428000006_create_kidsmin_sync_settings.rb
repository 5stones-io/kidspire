class CreateKidsminSyncSettings < ActiveRecord::Migration[7.2]
  def change
    create_table :kidsmin_sync_settings do |t|
      t.boolean  :inbound_people_sync,          null: false, default: true
      t.boolean  :outbound_people_sync,         null: false, default: false
      t.boolean  :inbound_events_sync,          null: false, default: true
      t.boolean  :outbound_registrations_sync,  null: false, default: false
      t.integer  :sync_frequency_hours,         null: false, default: 6
      t.string   :conflict_resolution,          null: false, default: "pco_wins"
      t.datetime :last_synced_at

      t.timestamps
    end
  end
end
