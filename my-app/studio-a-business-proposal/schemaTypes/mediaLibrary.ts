import {defineField, defineType} from 'sanity'

export const mediaLibrary = defineType({
  name: 'mediaLibrary',
  title: 'Media Library',
  type: 'document',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'company',
      type: 'number',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'alt',
      title: 'Alt Text',
      type: 'string',
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'string',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        layout: 'tags'
      }
    }),
    defineField({
      name: 'pending_partner',
      title: 'Pending Partner',
      type: 'boolean',
    }),
    defineField({
      name: 'partner',
      title: 'partner',
      type: 'boolean',
    }),
    defineField({
      name: 'hiring_tags',
      title: 'Hiring Tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        layout: 'tags'
      }
    }),
    defineField({
      name: 'external_media',
      title: 'External Media',
      type: 'string',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
    }),
    defineField({
      name: 'people',
      type: 'string',
      title: 'People',
    })
  ],
  preview: {
    select: {
      title: 'caption',
      media: 'image'
    },
    prepare({title, media}) {
      return {
        title: title || 'Untitled Image',
        media,
      }
    }
  }
})
