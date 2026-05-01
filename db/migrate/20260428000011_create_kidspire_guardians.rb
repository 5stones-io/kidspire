class CreateKidspireGuardians < ActiveRecord::Migration[7.2]
  def change
    create_table :kidspire_guardians do |t|
      t.references :family, null: false,
                             foreign_key: { to_table: :kidspire_families },
                             index: true
      t.string :first_name,   null: false
      t.string :last_name
      t.string :phone
      t.string :email
      t.string :relationship  # "Mother", "Father", "Grandparent", "Guardian", etc.

      t.timestamps
    end
  end
end
