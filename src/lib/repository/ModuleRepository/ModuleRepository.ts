import type {BeeService} from "$lib/services/BeeService/BeeService";
import type {RedisService} from "$lib/services/RedisService/RedisService";
import {uuid} from "uuidv4";
import societyRepository from "$lib/repository/SocietyRepository";
import type {ModuleType} from "$lib/types/module";
import type {SocietyType} from "$lib/types/society";

export class ModuleRepository {
  private beeService: BeeService;
  private redisService: RedisService;

  constructor({beeService, redisService}: { beeService: BeeService, redisService: RedisService }) {
    this.beeService = beeService;
    this.redisService = redisService;
  }

  async save(module: ModuleType) {
    const societies = await societyRepository.all()

    try {
      const id = uuid();

      (societies[module.societyId] as Required<SocietyType>).courses[module.courseId].modules = {...societies[module.societyId as string].courses?.[module.courseId].modules, [id]: {id, ...module}}

      const {reference} = await this.beeService.mutate({data: societies})

      await this.redisService.setData('reference', reference)
      return societies[module.societyId as string].courses?.[module.courseId].modules?.[id]
    } catch (e) {
      throw new Error('Not able to save module', e as Error)
    }
  }

  async update(module: ModuleType) {
    // get all societies
    const societies = await societyRepository.all()
    if (societies[module.societyId]?.courses?.[module.courseId as string].modules?.[module.id as string]) {
      (societies[module.societyId] as Required<SocietyType>).courses[module.courseId as string].modules =  {...societies[module.societyId].courses?.[module.courseId as string].modules, [module.id as string]: module}
    }
    // merge and save
    const {reference} = await this.beeService.mutate({data: societies})

    await this.redisService.setData('reference', reference)
    return societies[module.societyId].courses?.[module.courseId as string].modules?.[module.id as string]
  }

  async all(societyId: string, courseId: string) {
    const societies = await societyRepository.all()
    if (societies[societyId]) {
      return societies[societyId].courses?.[courseId].modules
    }
    return []
  }

  async delete(module: ModuleType) {
    try {
      const societies = await societyRepository.all()
      if (societies[module.societyId].courses?.[module.courseId as string].modules?.[module.id as string]) {
        delete societies[module.societyId].courses?.[module.courseId as string].modules?.[module.id as string]
      }
      const {reference} = await this.beeService.mutate({data: societies})
      await this.redisService.setData('reference', reference)
      return true
    } catch (e) {
      return false
    }
  }
}
