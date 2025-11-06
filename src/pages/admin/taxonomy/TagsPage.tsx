import type { FC } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import TaxonomyManager from '../../../components/admin/taxonomy/TaxonomyManager';
import { tagService } from '../../../services/tagService';
import type { Tag, TaxonomyFormValues } from '../../../types/taxonomy';

const TagsPage: FC = () => {
  const createEntity = (payload: TaxonomyFormValues) => tagService.create(payload);
  const updateEntity = (id: number, payload: TaxonomyFormValues) => tagService.update({ id, ...payload });
  const archiveEntity = (id: number) => tagService.archive(id);

  return (
    <AdminLayout>
      <TaxonomyManager<Tag>
        title="Tags"
        entityName="Tag"
        description="Manage reusable product tags to speed up search, promotions, and targeted reporting."
        fetchEntities={() => tagService.getAll()}
        createEntity={createEntity}
        updateEntity={updateEntity}
        archiveEntity={archiveEntity}
      />
    </AdminLayout>
  );
};

export default TagsPage;
