import type { FC } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import TaxonomyManager from '../../../components/admin/taxonomy/TaxonomyManager';
import { brandService } from '../../../services/brandService';
import type { Brand, TaxonomyFormValues } from '../../../types/taxonomy';

const BrandsPage: FC = () => {
  const createEntity = (payload: TaxonomyFormValues) => brandService.create(payload);
  const updateEntity = (id: number, payload: TaxonomyFormValues) => brandService.update({ id, ...payload });
  const archiveEntity = (id: number) => brandService.archive(id);

  return (
    <AdminLayout>
      <TaxonomyManager<Brand>
        title="Brands"
        entityName="Brand"
        description="Organize product brands to help staff filter items, keep catalogs consistent, and report on brand performance."
        fetchEntities={() => brandService.getAll()}
        createEntity={createEntity}
        updateEntity={updateEntity}
        archiveEntity={archiveEntity}
      />
    </AdminLayout>
  );
};

export default BrandsPage;
