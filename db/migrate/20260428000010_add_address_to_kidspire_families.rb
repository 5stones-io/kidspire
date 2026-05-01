class AddAddressToKidspireFamilies < ActiveRecord::Migration[7.2]
  def change
    add_column :kidspire_families, :address, :string
  end
end
