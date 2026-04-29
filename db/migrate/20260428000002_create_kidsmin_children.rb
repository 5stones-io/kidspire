class CreateKidsminChildren < ActiveRecord::Migration[7.2]
  def change
    create_table :kidsmin_children do |t|
      t.references :family, null: false,
                             foreign_key: { to_table: :kidsmin_families },
                             index: true
      t.string   :first_name,   null: false
      t.string   :last_name,    null: false
      t.date     :birthdate
      t.string   :grade
      t.text     :notes
      t.string   :pco_person_id
      t.datetime :pco_last_synced_at

      t.timestamps
    end

    add_index :kidsmin_children, :pco_person_id
  end
end
