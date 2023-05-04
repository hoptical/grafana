package commands

import (
	"context"

	"github.com/hashicorp/go-version"

	"github.com/grafana/grafana/pkg/cmd/grafana-cli/logger"
	"github.com/grafana/grafana/pkg/cmd/grafana-cli/models"
	"github.com/grafana/grafana/pkg/cmd/grafana-cli/services"
	"github.com/grafana/grafana/pkg/cmd/grafana-cli/utils"
	"github.com/grafana/grafana/pkg/plugins"
)

func shouldUpgrade(installedVer string, remote *models.Plugin) bool {
	installedVersion, err := version.NewVersion(installedVer)
	if err != nil {
		return false
	}

	latest := latestSupportedVersion(remote)
	latestVersion, err := version.NewVersion(latest.Version)
	if err != nil {
		return false
	}
	return installedVersion.LessThan(latestVersion)
}

func upgradeAllCommand(c utils.CommandLine) error {
	pluginsDir := c.PluginDirectory()

	localPlugins := services.GetLocalPlugins(pluginsDir)

	remotePlugins, err := services.ListAllPlugins(c.String("repo"))
	if err != nil {
		return err
	}

	pluginsToUpgrade := make([]plugins.FoundPlugin, 0)

	for _, localPlugin := range localPlugins {
		for _, p := range remotePlugins.Plugins {
			remotePlugin := p
			if localPlugin.Primary.JSONData.ID != remotePlugin.ID {
				continue
			}
			if shouldUpgrade(localPlugin.Primary.JSONData.Info.Version, &remotePlugin) {
				pluginsToUpgrade = append(pluginsToUpgrade, localPlugin.Primary)
			}
		}
	}

	ctx := context.Background()
	for _, p := range pluginsToUpgrade {
		logger.Infof("Updating %v \n", p.JSONData.ID)

		err = uninstallPlugin(ctx, p.JSONData.ID, c)
		if err != nil {
			return err
		}

		err = installPlugin(ctx, p.JSONData.ID, "", c)
		if err != nil {
			return err
		}
	}

	if len(pluginsToUpgrade) > 0 {
		logRestartNotice()
	}

	return nil
}
